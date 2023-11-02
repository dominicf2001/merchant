import { Kysely, PostgresDialect, Updateable, Insertable, sql, Selectable } from 'kysely';
import { Users as User, NewUsers as NewUser, UsersUpdate as UserUpdate, UsersUserId } from './schemas/public/Users';
import { Items as Item, NewItems as NewItem, ItemsUpdate as ItemUpdate, ItemsItemId } from './schemas/public/Items';
import { Stocks as Stock, NewStocks as NewStock, StocksUpdate as StockUpdate, StocksCreatedDate } from './schemas/public/Stocks';
import { UserItems as UserItem, NewUserItems as NewUserItem, UserItemsUpdate as UserItemUpdate } from './schemas/public/UserItems';
import Database from './schemas/Database';
import { DateTime } from 'luxon';
import { Deque } from '@datastructures-js/deque';

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
        max: 10
    })
});

const db = new Kysely<Database>({
    dialect,
    // log: ['query', 'error']
});

type TableName = keyof Database;
type TableID = 'user_id' | 'item_id' | 'stock_id';

abstract class DataStore<Data> {
    protected cache: Collection<string, Deque<Data>>;
    protected db: Kysely<Database>;
    protected tableName: TableName;
    protected tableID: TableID;

    async refreshCache(): Promise<void> {
        const results: Data[] = await db.selectFrom(this.tableName).selectAll().execute() as Data[];

        results.forEach(result => {
            this.cache.set(result[this.tableID], new Deque<Data>([result]));
        });
    }

    async delete(id: string): Promise<void> {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName as any)
            .where(this.tableID, '=', id as any)
            .execute();
    }

    getFromCache(id: string) : Data | undefined {
        return this.cache.get(id)?.front();        
    }

    async getFromDB(id: string): Promise<Data | undefined> {
        return await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, '=', id as any)
            .executeTakeFirst() as Data;
    }

    async get(id: string): Promise<Data | undefined> {
        if (this.cache.has(id)) {
            // cache hit
            return this.getFromCache(id);
        } else {
            // cache miss
            return await this.getFromDB(id);            
        }
    }

    async set(id: string, data: Insertable<Data> | Updateable<Data> = {}): Promise<void> {
        const newData: Data = { [this.tableID]: id as any, ...data } as Data;

        try {
            let result: Data = await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .where(this.tableID, '=', id as any)
                .executeTakeFirst() as Data;

            if (result) {
                result = await this.db
                    .updateTable(this.tableName)
                    .set(newData)
                    .where(this.tableID, '=', id as any)
                    .returningAll()
                    .executeTakeFirstOrThrow() as Data;
            } else {
                result = await this.db
                    .insertInto(this.tableName)
                    .values(newData)
                    .returningAll()
                    .executeTakeFirstOrThrow() as Data;
            }

            this.cache.set(id, new Deque<Data>([result]));
        } catch (error) {
            console.error(error);
            throw error;
        }
    }


    constructor(db: Kysely<Database>, tableName: TableName, tableID: TableID) {
        this.cache = new Collection<TableID, Deque<Data>>();
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
        this.refreshCache();
    }
}

class Users extends DataStore<User> {
    async get(id: string): Promise<User | undefined> {
        if (this.cache.has(id)) {
            // cache hit
            return this.getFromCache(id);
        } else {
            // cache miss
            return await this.getFromDB(id);
        }
    }
    
    async addBalance(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);
        
        let newBalance = user ? (user.balance + amount) : amount;
        if (newBalance < 0) newBalance = 0;

        await this.set(user_id, {
            balance: newBalance
        });
    }

    async addArmor(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);

        let newArmor = user ? (user.armor + amount) : amount;
        if (newArmor < 0) newArmor = 0;

        await this.set(user_id, {
            armor: newArmor
        });
    }

    async addActivityPoints(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);

        let newActivityPoints = user ? (user.activity_points + amount) : amount;
        if (newActivityPoints < 0) newActivityPoints = 0;

        await this.set(user_id, {
            activity_points: newActivityPoints
        });
    }
    
    async addItem(user_id: string, item_id: string, amount: number): Promise<void> {
        const userItem = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as any)
            .where('item_id', '=', item_id as any)
            .executeTakeFirst();

        if (!userItem && amount > 0) {
            await this.set(user_id);
            
            await this.db
                .insertInto('user_items')
                .values({
                    user_id: user_id as UsersUserId,
                    item_id: item_id as ItemsItemId,
                    quantity: amount
                })
                .execute();
            return;
        } else if (!userItem && amount <= 0) {
            return;
        }

        const newQuantity = userItem.quantity + amount;
        if (newQuantity <= 0) {
            await this.db
                .deleteFrom('user_items')
                .where('user_id', '=', user_id as any)
                .where('item_id', '=', item_id as any)
                .execute();
        } else {
            await this.db
                .updateTable('user_items')
                .set({
                    quantity: newQuantity
                })
                .where('user_id', '=', user_id as any)
                .where('item_id', '=', item_id as any)
                .execute();
        }
    }

    async setBalance(user_id: string, amount: number): Promise<void> {
        if (amount < 0) amount = 0;

        await this.set(user_id, {
            balance: amount
        });
    }

    async setActivityPoints(user_id: string, amount: number): Promise<void> {
        if (amount < 0) amount = 0;

        await this.set(user_id, {
            activity_points: amount
        });
    }

    async getBalance(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user.balance;
    }

    async getArmor(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user.armor;
    }

    async getActivityPoints(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user.activity_points;
    }

    async getItem(user_id: string, item_id: string): Promise<UserItem | undefined> {
        const userItem: UserItem = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as UsersUserId)
            .where('item_id', '=', item_id as ItemsItemId)
            .executeTakeFirst() as UserItem;
        
        return userItem;
    }

    async getItems(user_id: string): Promise<UserItem[]> {
        const userItems: UserItem[] = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as UsersUserId)
            .execute() as UserItem[];
        return userItems;
    }

    constructor(db: Kysely<Database>) {
        super(db, 'users', 'user_id');
    }
}

class Items extends DataStore<Item> {
    async refreshCache(): Promise<void> {
        // const itemsPath = path.join(process.cwd(), 'items');
        // const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
        // for (const file of itemFiles) {
        //     const filePath = path.join(itemsPath, file);
        //     const item: Item = await import(filePath);
        //     if ('data' in item && 'use' in item) {
        //         this.cache.set(item.data., item);
        //     } else {
        //         console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
        //     }
        // }
    }

    constructor(db: Kysely<Database>) {
        super(db, 'items', 'item_id');
    }
}

type StockInterval = 'now' | 'hour' | 'day' | 'month';

class Stocks extends DataStore<Stock> {
    // caches the 'now' stock history for each stock
    async refreshCache(): Promise<void> {
        const latestStocks: Stock[] = await this.getLatestStocks();
        
        for (const latestStock of latestStocks) {
            const stockHistory: Stock[] = await this.getStockHistory(latestStock.stock_id, 'now');
            this.cache.set(latestStock[this.tableID], new Deque<Stock>(stockHistory));   
        }
    }

    async getFromDB(id: string): Promise<Stock | undefined> {
        return await this.db
            .selectFrom('stocks')
            .selectAll()
            .where('stock_id', '=', id as UsersUserId)
            .orderBy('created_date desc')
            .executeTakeFirst() as Stock;
    }

    async set(id: string, data: Insertable<Stock> | Updateable<Stock> = {}): Promise<void> {
        const newData: Stock = {
            stock_id: id as UsersUserId,
            created_date: data.created_date ?? DateTime.now().toISO() as StocksCreatedDate,
            ...data
        } as Stock;

        await db.transaction().execute(async (trx) => {
            const result: Stock = await trx
                .insertInto('stocks')
                .values(newData)
                .returningAll()
                .executeTakeFirstOrThrow() as Stock;

            let cachedStockHistory = this.cache.get(id);
            if (cachedStockHistory) {
                cachedStockHistory.pushFront(result);
                cachedStockHistory.popBack();   
            } else {
                this.cache.set(id, new Deque<Stock>([result]));
            }
        });
    }

    async get(id: string): Promise<Stock | undefined> {
        if (this.cache.has(id)) {
            // cache hit
            return this.getFromCache(id);
        } else {
            // cache miss
            return await this.getFromDB(id);
        }
    }
    
    async updateStockPrice(stock_id: string, amount: number): Promise<void> {
        if (amount < 0) amount = 0;

        this.set(stock_id, { price: amount });
    }
    
    async getLatestStocks(): Promise<Stock[]> {
        let latestStocks: Stock[];
        if (this.cache.size) {
            let i = 0;
            for (const stockId in this.cache) {
                console.log(stockId);
                latestStocks[i++] = this.cache.get(stockId).front();
            }
        } else {
            try {
                latestStocks = await this.db
                    .selectFrom('stocks as s1')
                    .selectAll()
                    .innerJoin(
                        eb => eb
                            .selectFrom('stocks')
                            .select(['stock_id', eb => eb.fn.max('created_date').as('max_created_date')])
                            .groupBy('stock_id')
                            .as('s2'),
                        join => join.onRef('s1.stock_id', '=', 's2.stock_id').onRef('s1.created_date', '=', 's2.max_created_date')
                    )
                    .orderBy('s1.created_date', 'desc')
                    .execute();
                return latestStocks;
            } catch (error) {
                console.error("Error getting latest stocks: ", error);
            }
        }
    }

    async getLatestStock(stock_id: string): Promise<Stock> {
        return await this.get(stock_id);
    }

    async getStockHistory(stock_id: string, interval: StockInterval = 'now'): Promise<Stock[]> {
        // only 'now' is stored in the cache currently
        if (interval === 'now' && this.getFromCache(stock_id)) {
            // cache hit on 'now'
            return this.cache.get(stock_id).toArray();
        } 
        
        let intervalOffset: Object;
        switch (interval) {
            case 'now':
                intervalOffset = { minutes: 10 }
                break;
            case 'hour':
                intervalOffset = { hours: 24 }
                break;
            case 'day':
                intervalOffset = { days: 30 }
                break;
            case 'month':
                intervalOffset = { months: 6 }
                break;                
        }
        
        const oldestStockDate: string = DateTime.now().minus(intervalOffset).toISO();
        
        const stockHistory: Stock[] = await this.db
            .selectFrom('stocks as s1')
            .innerJoin(
                eb => eb
                    .selectFrom('stocks')
                    .select([
                        'stock_id',
                        eb => eb.fn.max('created_date').as('max_created_date'),
                        eb => sql`extract(${sql.raw(interval === 'now' ? 'minute' : interval)} from ${eb.ref('created_date')})`.as('created_interval')
                    ])
                    .groupBy('created_interval')
                    .groupBy('stock_id')
                    .as('s2'),
                join => join.onRef('s1.stock_id', '=', 's2.stock_id').onRef('s1.created_date', '=', 's2.max_created_date')
            )
            .selectAll()
            .where('s1.stock_id', '=', stock_id as UsersUserId)
            .where('s1.created_date', '>=', oldestStockDate as StocksCreatedDate)
            .orderBy('s1.created_date', 'desc')
            .execute();

        return stockHistory;
    }
    
    constructor(db: Kysely<Database>) {
        super(db, 'stocks', 'stock_id');
    }
}

// class Commands extends DataStore<Command> {
//     async refreshCache(): Promise<void> {
//         const foldersPath: string = path.join(process.cwd(), 'commands');
//         const commandFolders: string[] = fs.readdirSync(foldersPath);

//         for (const folder of commandFolders) {
//             const commandsPath: string = path.join(foldersPath, folder);
//             const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
//             for (const file of commandFiles) {
//                 const filePath: string = path.join(commandsPath, file);
//                 const command: Command = await import(filePath);
//                 if ('data' in command && 'execute' in command) {
//                     this.cache.set(command.data.name, command);
//                 } else {
//                     console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
//                 }
//             }
//         }
//     }
// }

const users = new Users(db);
const items = new Items(db);
const stocks = new Stocks(db);

export { users as Users, items as Items, stocks as Stocks, db};
