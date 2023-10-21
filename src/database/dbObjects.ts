// const Sequelize = require('sequelize');
// const sequelize = new Sequelize('database', 'username', 'password', {
// 	host: 'localhost',
// 	dialect: 'sqlite',
// 	logging: false,
// 	storage: './database/database.sqlite',
// });

// const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
// const UserCooldowns = require('./models/UserCooldowns.js')(sequelize, Sequelize.DataTypes);

// const Items = require('./models/Items.js')(sequelize, Sequelize.DataTypes);
// const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);

// const Stocks = require('./models/Stocks.js')(sequelize, Sequelize.DataTypes);
// const UserStocks = require('./models/UserStocks.js')(sequelize, Sequelize.DataTypes);

// UserItems.belongsTo(Items, { foreignKey: 'item_id', as: 'item' });

// UserStocks.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });
// UserStocks.belongsTo(Stocks, { foreignKey: 'stock_user_id', as: 'stock' });
// Users.hasMany(UserStocks, { foreignKey: 'user_id' });
// Stocks.hasMany(UserStocks, { foreignKey: 'stock_user_id' });

import { Collection } from 'discord.js';
import path from 'path';
import fs from 'fs';

// TODO: figure out item and command types
// database type depends on new sql
abstract class DataStore<Data> {
    protected cache: Collection<string, Data>
    protected database: any | null

    abstract refreshCache(): Promise<void>;

    get(id: string): Promise<Data> {
        const cachedData: Data = this.cache.get(id);
        
        if (!cachedData && this.database) {
            // perform database look up by id
            // Set cached data to looked up data if it exists
        }
        
        return Promise.resolve(cachedData);
    }

    set(id: string, data: Data): Promise<void> {
        this.cache.set(id, data);

        // perform an upsert on the database IF there is a database
    }
    
    constructor(database: any | null = null) {
        this.cache = new Collection<string, Data>();
        this.database = database;
    }
}

abstract class Data {
    protected dataStore: DataStore<Data>;

    constructor(dataStore: DataStore<Data>) {
        this.dataStore = dataStore;
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

class Command extends Data {
    
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
    // TODO: replace with sql    
    async refreshCache(): Promise<void> {
        const usersData: any[] = [];// db lookup
        
        usersData.forEach(userData => {
            user: User = new User(this);
            this.cache.set(user.user_id, user)
        });

class User extends Data {
    balance: number;
    
    addBalance(amount: number): void {
        this.balance = this.balance + amount;
        if (this.balance < 0) this.balance = 0;
        // return t ? user.save({ transaction: t }) : user.save();

        const newUser = await(t ? Users.create({ user_id: id, balance: (amount < 0 ? 0 : amount) }, { transaction: t }) : Users.create({ user_id: id, balance: amount }));
        usersCache.set(id, newUser);
    }
}


// direct queries, no cache. (UserItems). Should eventually make a cache, and put functions in utilities file
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

