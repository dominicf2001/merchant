import { Collection } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import Database from './schemas/Database';
import { Items as Item, ItemsItemId } from './schemas/public/Items';
import { Stocks as Stock, NewStocks as NewStock, StocksUpdate as StockUpdate } from './schemas/public/Stocks';
import { Users as User, NewUsers as NewUser, UsersUpdate as UserUpdate, UsersUserId } from './schemas/public/Users';

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

abstract class DataStore<T> {
    protected cache: Collection<string, T>;
    protected db: Kysely<Database> | null;

    abstract refreshCache(): Promise<void>;

    abstract get(id: string): Promise<T | null>;

    abstract set(id: string, data: Partial<T>): Promise<void>;

    constructor(db: any | null = null) {
        this.cache = new Collection<string, T>();
        this.db = db;
    }
}

class Users extends DataStore<User> {
    async refreshCache(): Promise<void> {
        const result: User[] = await db.selectFrom("users").selectAll().execute();

        result.forEach(user => {
            this.cache.set(user.user_id, user)
        });
    }

    async get(id: string): Promise<User | null> {
        const userId = id as UsersUserId;
        
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        if (this.db) {
            const result: User = await this.db
                .selectFrom("users")
                .selectAll()
                .where('user_id', '=', userId)
                .executeTakeFirst();
            return result;
        }

        return null;
    }

    async set(id: string, data: NewUser | UserUpdate): Promise<void> {
        const userId = id as UsersUserId;

        if (this.cache.has(userId)) {
            // merge the data
            const existingData = this.cache.get(userId);
            this.cache.set(userId, {...existingData, ...data});
        }

        let result: User;
        if (this.db) {
            result = await this.db
                .selectFrom('users')
                .selectAll()
                .where('user_id', '=', userId)
                .executeTakeFirst();
            if (result) {
                await this.db
                    .updateTable('users')
                    .set(data)
                    .where('user_id', '=', userId)
                    .execute();
            } else {
                result = await this.db
                    .insertInto('users')
                    .values({user_id: userId, ...data})
                    .returningAll()
                    .executeTakeFirst();                
            }
        }

        this.cache.set(userId, result);
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

