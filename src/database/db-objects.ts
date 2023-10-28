import { Kysely, PostgresDialect, Updateable, Insertable } from 'kysely';
import { Users as User, NewUsers as NewUser, UsersUpdate as UserUpdate, UsersUserId } from './schemas/public/Users';
import { Items as Item, NewItems as NewItem, ItemsUpdate as ItemUpdate, ItemsItemId } from './schemas/public/Items';
import { Stocks as Stock, NewStocks as NewStock, StocksUpdate as StockUpdate } from './schemas/public/Stocks';
import Database from './schemas/Database';
import PublicSchema from './schemas/public/PublicSchema';

import { Collection } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';

const dialect = new PostgresDialect({
    pool: new Pool({
        database: 'merchant',
        host: 'localhost',
        user: 'dominic',
        port: 5432,
        max: 10,
    }),
});

const db = new Kysely<Database>({
    dialect,
});

type TableName = keyof Database;
type PrimaryKey = UsersUserId | ItemsItemId;

abstract class DataStore<Data extends PublicSchema> {
    protected cache: Collection<PrimaryKey, Data>;
    protected db: Kysely<Database> | null;
    protected tableName: TableName | null;
    protected primaryKey: PrimaryKey | null;

    abstract refreshCache(): Promise<void>;

    async get(id: PrimaryKey): Promise<Data | null> {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        if (this.db && this.tableName && this.primaryKey) {
            const result: any = await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .where(this.primaryKey as any, '=', id)
                .executeTakeFirst();
            return result;
        }

        return null;
    }

    async set(id: PrimaryKey, data: Insertable<Data> | Updateable<Data>): Promise<void> {
        if (this.cache.has(id)) {
            // merge the data
            const existingData: Data = this.cache.get(id);
            this.cache.set(id, { ...existingData, ...data });
        }

        let result: any;
        if (this.db) {
            result = await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .where(this.primaryKey as any, '=', id)
                .executeTakeFirst();
            if (result) {
                await this.db
                    .updateTable('users')
                    .set(data)
                    .where(this.primaryKey as any, '=', id)
                    .execute();
            } else {
                result = await this.db
                    .insertInto('users')
                    .values({ user_id: id, ...data })
                    .returningAll()
                    .executeTakeFirst();
            }
        }

        this.cache.set(id, result);
    }

    constructor(db: any | null = null, tableName?: TableName, primaryKey?: PrimaryKey) {
        this.cache = new Collection<PrimaryKey, Data>();
        this.db = db;
        this.tableName = tableName;
        this.primaryKey = primaryKey;
    }
}

class Users extends DataStore<User> {
    async refreshCache(): Promise<void> {
        const result: User[] = await db.selectFrom("users").selectAll().execute();

        result.forEach(user => {
            this.cache.set(user.user_id, user)
        });
    }

// TODO: should make a transaction?
    addBalance(id: string, amount: number): void {
        const user: User = this.get(id);

        user.balance += amount;
        if (user.balance < 0) user.balance = 0;

        this.set(id, user);
    }
}

class Commands extends DataStore<Command> {
    async refreshCache(): Promise<void> {
        const foldersPath: string = path.join(process.cwd(), 'commands');
        const commandFolders: string[] = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath: string = path.join(foldersPath, folder);
            const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath: string = path.join(commandsPath, file);
                const command: Command = await import(filePath);
                if ('data' in command && 'execute' in command) {
                    this.cache.set(command.data.name, command);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }
}

class Items extends DataStore<Item> {
    async refreshCache(): Promise<void> {
        const itemsPath = path.join(process.cwd(), 'items');
        const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
        for (const file of itemFiles) {
            const filePath = path.join(itemsPath, file);
            const item: Item = await import(filePath);
            if ('data' in item && 'use' in item) {
                this.cache.set(item.data.name, item);
            } else {
                console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
            }
        }
    }
}

class Stocks extends DataStore<Stock> {
    async refreshCache(): Promise<void> {
        // TODO: replace with sql
        // Move to abstract dataStore class?
        const allLatestStocks: Stock[] = await getAllLatestStocks();
        allLatestStocks.forEach(stock => this.cache.set(stock.user_id, stock));
    }
}

Reflect.defineProperty(Users.prototype, 'addItem', {
	value: async function(item) {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});

		if (userItem) {
			userItem.quantity += 1;
			return userItem.save();
		}

		return UserItems.create({ user_id: this.user_id, item_id: item.id, quantity: 1 });
	},
});

Reflect.defineProperty(Users.prototype, 'removeItem', {
	value: async function(item) {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});

		if (userItem) {
			userItem.quantity -= 1;
            if (userItem.quantity <= 0) {
                return userItem.destroy();
            } else {
			    return userItem.save();
            }
		}
	},
});

Reflect.defineProperty(Users.prototype, 'getItems', {
	value: function() {
		return UserItems.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});

Reflect.defineProperty(Users.prototype, 'getItem', {
	value: function(itemName) {
		return UserItems.findOne({
			where: {
				user_id: this.user_id,
				'$item.name$': itemName
			},
			include: [{
				model: Items,
				as: 'item',
			}],
		});
	},
});

export { Users, Items, UserItems, UserCooldowns, Stocks, UserStocks };

