import { Kysely, PostgresDialect, Updateable, Insertable, sql } from 'kysely';
import { Users as User, UsersUserId } from './schemas/public/Users';
import { Items as Item, ItemsItemId } from './schemas/public/Items';
import { Stocks as Stock, StocksCreatedDate } from './schemas/public/Stocks';
import { Commands as Command, CommandsCommandId } from './schemas/public/Commands';
import { UserItems as UserItem } from './schemas/public/UserItems';
import { UserStocks as UserStock  } from './schemas/public/UserStocks';
import { UserCooldowns as UserCooldown } from './schemas/public/UserCooldowns';
import Database from './schemas/Database';
import { DateTime } from 'luxon';
import { Deque } from '@datastructures-js/deque';

import { Collection, Message } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { Pool, types } from 'pg';
import { UserStocks, UserStocksPurchaseDate } from './schemas/public/UserStocks';

types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => v === null ? null : new Date(v).toISOString());

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
type TableID = 'user_id' | 'item_id' | 'stock_id' | 'command_id';
type StockInterval = 'now' | 'hour' | 'day' | 'month';
type BehaviorFunction = (message: Message, args: string[]) => Promise<void>;

abstract class DataStore<Data> {
    protected cache: Collection<string, Deque<Data>> = new Collection<string, Deque<Data>>();
    protected db: Kysely<Database>;
    protected references: Collection<string, DataStore<any>> = new Collection<string, DataStore<any>>();
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

    async getAll(): Promise<Data[]> {
        if (this.cache.size) {
            // cache hit
            const allData: Data[] = [];
            for (const id of this.cache.keys()) {
                allData.push(this.cache.get(id).front());
            }
            return allData;
        } else {
            // cache miss
            return await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .execute() as Data[];
        }
    }

    async set(id: string, data: Insertable<Data> | Updateable<Data> = {}): Promise<void> {
        const newData: Data = { [this.tableID]: id as any, ...data } as Data;
        console.log("Setting data...");
        console.log(newData);

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


    constructor(db: Kysely<Database>, tableName: TableName, tableID: TableID, references: Collection<string, DataStore<any>>) {
        this.cache = new Collection<TableID, Deque<Data>>();
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
        this.references = references;
        this.refreshCache();
    }
}

class Users extends DataStore<User> {    
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
    
    async addItem(user_id: string, item_id: string, amount: number): Promise<number> {
        let amountAddedOrRemoved = 0;

        await this.db.transaction().execute(async trx => {
            // Check if item exists
            const Items = this.references.get('items') as Items;
            const itemExists = !!(await Items.get(item_id));
            
            if (!itemExists)
                return;

            if (amount > 0) {
                // If amount is positive, increment the existing record or insert a new one.
                const userItem = await trx
                    .selectFrom('user_items')
                    .selectAll()
                    .where('user_id', '=', user_id as any)
                    .where('item_id', '=', item_id as any)
                    .executeTakeFirst();

                if (!userItem) {
                    await this.set(user_id);

                    await trx
                        .insertInto('user_items')
                        .values({
                            user_id: user_id as UsersUserId,
                            item_id: item_id as ItemsItemId,
                            quantity: amount
                        })
                        .execute();
                } else {
                    const newQuantity = userItem.quantity + amount;
                    await trx
                        .updateTable('user_items')
                        .set({ quantity: newQuantity })
                        .where('user_id', '=', user_id as any)
                        .where('item_id', '=', item_id as any)
                        .execute();
                }

                amountAddedOrRemoved = amount;
            } else if (amount < 0) {
                // If amount is negative, decrement the existing record.
                const userItem = await trx
                    .selectFrom('user_items')
                    .selectAll()
                    .where('user_id', '=', user_id as any)
                    .where('item_id', '=', item_id as any)
                    .executeTakeFirst();

                if (userItem) {
                    const newQuantity = userItem.quantity + amount;  // amount is negative
                    if (newQuantity <= 0) {
                        await trx
                            .deleteFrom('user_items')
                            .where('user_id', '=', user_id as any)
                            .where('item_id', '=', item_id as any)
                            .execute();
                        amountAddedOrRemoved = -userItem.quantity;  // All items were removed
                    } else {
                        await trx
                            .updateTable('user_items')
                            .set({ quantity: newQuantity })
                            .where('user_id', '=', user_id as any)
                            .where('item_id', '=', item_id as any)
                            .execute();
                        amountAddedOrRemoved = amount;  // The specified negative amount was removed
                    }
                }
            }
        });

        return amountAddedOrRemoved;
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
        return user?.balance ?? 0;
    }

    async getArmor(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user?.armor ?? 0;
    }

    async getActivityPoints(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user?.activity_points ?? 0;
    }

    async getItemCount(user_id: string): Promise<number> {
        const items = await this.getItems(user_id);

        const itemCount = items?.reduce((previous, current) => {
            return previous + current.quantity;
        }, 0);

        return itemCount ?? 0;
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

    async getPortfolioValue(user_id: string): Promise<number> {
        const Stocks = this.references.get('stocks') as Stocks;
        const userStocks: UserStock[] = await this.getUserStocks(user_id);

        let portfolioValue = 0;
        for (const userStock of userStocks) {
            const latestPrice = (await Stocks.getLatestStock(userStock.stock_id)).price;
            portfolioValue += latestPrice * userStock.quantity;
        }
        
        return portfolioValue
    }

    async getNetWorth(user_id: string): Promise<number> {
        const portfolioValue = await this.getPortfolioValue(user_id);
        const balance = await this.getBalance(user_id);
        return portfolioValue + balance;
    }

    async getPortfolio(user_id: string): Promise<Stock[]> {
        const Stocks = this.references.get('stocks') as Stocks;

        const userStock: UserStock[] = await this.db
            .selectFrom('user_stocks')
            .select('stock_id')
            .where('user_id', '=', user_id as UsersUserId)
            .distinct()
            .execute() as UserStock[];

        // Populate with the latest stock information
        let stockPromises: Promise<Stock>[] = [];
        for (const stock of userStock) {
            stockPromises.push(Stocks.getLatestStock(stock.stock_id));
        }
        
        return await Promise.all(stockPromises) as Stock[];
    }
    
    async getUserStocks(user_id: string, stock_id?: string): Promise<UserStock[]> {
        let query = this.db
            .selectFrom('user_stocks')
            .selectAll()
            .where('user_id', '=', user_id as UsersUserId)

        query = stock_id ?
            query.where('stock_id', '=', stock_id as UsersUserId) :
            query;
        
        return (
            await query
                .orderBy('purchase_date desc')
                .execute() as UserStock[]
        );
    }
    
    async addStock(user_id: string, stock_id: string, amount: number): Promise<number> {
        let amountSoldOrBought = 0;
        
        await this.db.transaction().execute(async trx => {
            const Stocks = this.references.get('stocks') as Stocks;
            const currentStockPrice: number = (await Stocks.getLatestStock(stock_id))?.price;

            // prevents a user from being created and from inserting a non-existent stock
            if (currentStockPrice == undefined)
                return;
            
            if (amount > 0) {
                await this.set(user_id);
                
                // If amount is positive, insert a new record.
                await trx
                    .insertInto('user_stocks')
                    .values({
                        user_id: user_id as UsersUserId,
                        stock_id: stock_id as UsersUserId,
                        purchase_date: DateTime.now().toISO() as UserStocksPurchaseDate,
                        quantity: amount,
                        purchase_price: currentStockPrice,
                    })
                    .execute();
                
                amountSoldOrBought = amount;
            }
            else if (amount < 0) {
                // If amount is negative, decrement the existing records.
                const userStocks = await trx
                    .selectFrom('user_stocks')
                    .selectAll()
                    .where('user_id', '=', user_id as UsersUserId)
                    .where('stock_id', '=', stock_id as UsersUserId)
                    .orderBy('purchase_date desc')
                    .execute();

                // prevents a user from being created
                if (!userStocks.length)
                    return 0; 

                // amount is negative, make it positive
                let remainingAmountToDecrement = -amount;

                for (const userStock of userStocks) {
                    if (remainingAmountToDecrement <= 0) {
                        break;
                    }

                    const decrementedQuantity = userStock.quantity - remainingAmountToDecrement;

                    if (decrementedQuantity <= 0) {
                        // If decremented quantity is zero or negative, delete the record.
                        await trx
                            .deleteFrom('user_stocks')
                            .where('user_id', '=', user_id as UsersUserId)
                            .where('stock_id', '=', stock_id as UsersUserId)
                            .where('purchase_date', '=', userStock.purchase_date)
                            .execute();

                        remainingAmountToDecrement -= userStock.quantity;  // Deduct the full quantity of this record
                    } else {
                        // If decremented quantity is positive, update the record.
                        await trx
                            .updateTable('user_stocks')
                            .set({ quantity: decrementedQuantity })
                            .where('user_id', '=', user_id as UsersUserId)
                            .where('stock_id', '=', stock_id as UsersUserId)
                            .where('purchase_date', '=', userStock.purchase_date)
                            .execute();

                        remainingAmountToDecrement = 0;  // Stop, as all amount has been decremented
                    }
                    amountSoldOrBought = amount - remainingAmountToDecrement;
                }
            }
        });
        return amountSoldOrBought;
    }
    
    async getRemainingCooldownDuration(user_id: string, command_id: string): Promise<number> {
        const Commands = this.references.get('commands') as Commands;
        const command = await Commands.get(command_id);
        const cooldownAmount: number = command.cooldown_time;

        const userCooldown: UserCooldown = await this.db
            .selectFrom('user_cooldowns')
            .select(['start_date'])
            .where('user_id', '=', user_id as UsersUserId)
            .where('command_id', '=', command_id as CommandsCommandId)
            .executeTakeFirst() as UserCooldown;

        if (userCooldown) {
            const startDateTime = DateTime.fromISO(userCooldown.start_date);
            if (!startDateTime.isValid) {
                console.error('Invalid start date:', userCooldown.start_date);
                return 0;
            }

            const expirationDateTime = startDateTime.plus({ milliseconds: cooldownAmount });
            const remainingDuration = expirationDateTime.diffNow('millisecond').milliseconds;
            
            if (remainingDuration <= 0) {
                await this.db
                    .deleteFrom('user_cooldowns')
                    .where('user_id', '=', user_id as UsersUserId)
                    .where('command_id', '=', command_id as CommandsCommandId)
                    .execute();
                return 0;
            }

            return remainingDuration;
        }

        return 0; // No cooldown found
    }


    async createCooldown(user_id: string, command_id: string): Promise<void> {
        await this.db
            .insertInto('user_cooldowns')
            .values({
                user_id: user_id as UsersUserId,
                command_id: command_id as CommandsCommandId,
                start_date: DateTime.now().toISO()
            })
            .execute();
    }
    
    constructor(db: Kysely<Database>, references: Collection<string, DataStore<any>>) {
        super(db, 'users', 'user_id', references);
    }
}

class Items extends DataStore<Item> {
    private behaviors: Collection<string, BehaviorFunction> = new Collection<string, BehaviorFunction>();
    
    // async refreshCache(): Promise<void> {
    //     const itemsPath = path.join(process.cwd(), 'built/items');
    //     const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
    //     for (const file of itemFiles) {
    //         const filePath = path.join(itemsPath, file);
    //         const itemObj = await import(filePath);
    //         if ('data' in itemObj && 'use' in itemObj) {
    //             this.behaviors.set(itemObj.data.item_id, itemObj.use);
    //             this.set(itemObj.data.item_id, new Deque<Item>([itemObj.data]));
    //         } else {
    //             console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
    //         }
    //     }
    // }

    async use(item_id: string, message: Message, args: string[]): Promise<void> {
        const use: BehaviorFunction = this.behaviors.get(item_id);
         await use(message, args);
    }

    constructor(db: Kysely<Database>, references?: Collection<string, DataStore<any>>) {
        super(db, 'items', 'item_id', references);
    }
}

class Stocks extends DataStore<Stock> {
    // caches the 'now' stock history for each stock
    async refreshCache(): Promise<void> {
        const latestStocks: Stock[] = await this.getLatestStocks();
        
        for (const latestStock of latestStocks) {
            const stockHistory: Stock[] = await this.getStockHistory(latestStock.stock_id, 'now');
            this.cache.set(latestStock[this.tableID], new Deque<Stock>(stockHistory));   
        }
    }

    async getTotalSharesPurchased(stock_id: string): Promise<number> {
        const result = await this.db
            .selectFrom('user_stocks')
            .select(eb => eb.fn.sum('quantity').as('total_shares_purchased'))
            .where('stock_id', '=', stock_id as UsersUserId)
            .executeTakeFirst();

        return Number(result.total_shares_purchased) ?? 0;
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

    async getLatestStock(stock_id: string): Promise<Stock | undefined> {
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
    
    constructor(db: Kysely<Database>, references?: Collection<string, DataStore<any>>) {
        super(db, 'stocks', 'stock_id', references);
    }
}

class Commands extends DataStore<Command> {
    private behaviors: Collection<string, BehaviorFunction> = new Collection<string, BehaviorFunction>();
    
    async refreshCache(): Promise<void> {
        console.log("Refreshing commands");
        const foldersPath: string = path.join(process.cwd(), 'built/commands');
        const commandFolders: string[] = fs.readdirSync(foldersPath);

        console.log(commandFolders);
        for (const folder of commandFolders) {
            const commandsPath: string = path.join(foldersPath, folder);
            const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            console.log(commandFiles);
            for (const file of commandFiles) {
                const filePath: string = path.join(commandsPath, file);
                const commandObj = (await import(filePath)).default;
                console.log(commandObj);
                if ('data' in commandObj && 'execute' in commandObj) {
                    this.behaviors.set(commandObj.data.command_id, commandObj.execute);
                    this.set(commandObj.data.command_id, commandObj.data);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }

    async execute(command_id: string, message: Message, args: string[]): Promise<void> {
        const execute: BehaviorFunction = this.behaviors.get(command_id);
        await execute(message, args);
    }

    constructor(db: Kysely<Database>, references?: Collection<string, DataStore<any>>) {
        super(db, 'commands', 'command_id', references);
    }
}

const items = new Items(db)
const stocks = new Stocks(db);
const commands = new Commands(db);
const userReferences = new Collection<string, DataStore<any>>([
    ['stocks', stocks],
    ['items', items],
    ['commands', commands]
]);

const users = new Users(db, userReferences);

export { users as Users, items as Items, stocks as Stocks, commands as Commands, db};
