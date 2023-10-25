import { Collection } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import type { Selectable, Insertable, Updateable } from 'kysely';
import Database from './schemas/Database';
import { Items as Item } from './schemas/public/Items';
import { Stocks as Stock } from './schemas/public/Stocks';
import { Users as User } from './schemas/public/Users';

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
    protected cache: Collection<string, T>
    protected database: any | null

    abstract refreshCache(): Promise<void>;

    async get(id: string): Promise<Selectable<T>> {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }

        // search for it in db, if it exists set it in cache and return it
    }

    async set(id: string, data: Insertable<T> | Updateable<T>): Promise<void> {
        this.cache.set(id, data);
        // set in the db
    }

    constructor(database: any | null = null) {
        this.cache = new Collection<string, T>();
        this.database = database;
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


class Users extends DataStore<User> {
    async refreshCache(): Promise<void> {
        const usersData: any[] = [];// db lookup
        
        usersData.forEach(userData => {
            user: User = ;
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

