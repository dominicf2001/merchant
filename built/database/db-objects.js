"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Commands = exports.Stocks = exports.Items = exports.Users = void 0;
const kysely_1 = require("kysely");
const luxon_1 = require("luxon");
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pg_1 = require("pg");
pg_1.types.setTypeParser(pg_1.types.builtins.TIMESTAMPTZ, (v) => v === null ? null : new Date(v).toISOString());
const dialect = new kysely_1.PostgresDialect({
    pool: new pg_1.Pool({
        database: 'merchant',
        host: 'localhost',
        user: 'dominic',
        port: 5432,
        max: 10
    })
});
const db = new kysely_1.Kysely({
    dialect,
    // log: ['query', 'error']
});
exports.db = db;
class DataStore {
    cache = new discord_js_1.Collection();
    db;
    references = new discord_js_1.Collection();
    tableName;
    tableID;
    async refreshCache() {
        const results = await db.selectFrom(this.tableName).selectAll().execute();
        results.forEach(result => {
            this.cache.set(result[this.tableID], [result]);
        });
    }
    async delete(id) {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName)
            .where(this.tableID, '=', id)
            .execute();
    }
    getFromCache(id) {
        return this.cache.get(id)?.[0];
    }
    async getFromDB(id) {
        return await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, '=', id)
            .executeTakeFirst();
    }
    async get(id) {
        if (this.cache.has(id)) {
            // cache hit
            return this.getFromCache(id);
        }
        else {
            // cache miss
            return await this.getFromDB(id);
        }
    }
    async getAll() {
        if (this.cache.size) {
            // cache hit
            const allData = [];
            for (const id of this.cache.keys()) {
                const stockCache = this.cache.get(id);
                if (stockCache[0]) {
                    allData.push(stockCache[0]);
                }
            }
            return allData;
        }
        else {
            // cache miss
            return await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .execute();
        }
    }
    async set(id, data = {}) {
        const newData = { [this.tableID]: id, ...data };
        try {
            let result = await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .where(this.tableID, '=', id)
                .executeTakeFirst();
            if (result) {
                result = await this.db
                    .updateTable(this.tableName)
                    .set(newData)
                    .where(this.tableID, '=', id)
                    .returningAll()
                    .executeTakeFirstOrThrow();
            }
            else {
                result = await this.db
                    .insertInto(this.tableName)
                    .values(newData)
                    .returningAll()
                    .executeTakeFirstOrThrow();
            }
            this.cache.set(id, [result]);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
    constructor(db, tableName, tableID, references) {
        this.cache = new discord_js_1.Collection();
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
        this.references = references;
        this.refreshCache();
    }
}
class Users extends DataStore {
    async addBalance(user_id, amount) {
        const user = await this.get(user_id);
        let newBalance = user ? (user.balance + amount) : amount;
        if (newBalance < 0)
            newBalance = 0;
        await this.set(user_id, {
            balance: newBalance
        });
    }
    async addArmor(user_id, amount) {
        const user = await this.get(user_id);
        let newArmor = user ? (user.armor + amount) : amount;
        if (newArmor < 0)
            newArmor = 0;
        await this.set(user_id, {
            armor: newArmor
        });
    }
    async addActivityPoints(user_id, amount) {
        const user = await this.get(user_id);
        let newActivityPoints = user ? (user.activity_points + amount) : amount;
        if (newActivityPoints < 0)
            newActivityPoints = 0;
        await this.set(user_id, {
            activity_points: newActivityPoints
        });
    }
    async addItem(user_id, item_id, amount) {
        let amountAddedOrRemoved = 0;
        await this.db.transaction().execute(async (trx) => {
            // Check if item exists
            const Items = this.references.get('items');
            const itemExists = !!(await Items.get(item_id));
            if (!itemExists)
                return;
            if (amount > 0) {
                // If amount is positive, increment the existing record or insert a new one.
                const userItem = await trx
                    .selectFrom('user_items')
                    .selectAll()
                    .where('user_id', '=', user_id)
                    .where('item_id', '=', item_id)
                    .executeTakeFirst();
                if (!userItem) {
                    await this.set(user_id);
                    await trx
                        .insertInto('user_items')
                        .values({
                        user_id: user_id,
                        item_id: item_id,
                        quantity: amount
                    })
                        .execute();
                }
                else {
                    const newQuantity = userItem.quantity + amount;
                    await trx
                        .updateTable('user_items')
                        .set({ quantity: newQuantity })
                        .where('user_id', '=', user_id)
                        .where('item_id', '=', item_id)
                        .execute();
                }
                amountAddedOrRemoved = amount;
            }
            else if (amount < 0) {
                // If amount is negative, decrement the existing record.
                const userItem = await trx
                    .selectFrom('user_items')
                    .selectAll()
                    .where('user_id', '=', user_id)
                    .where('item_id', '=', item_id)
                    .executeTakeFirst();
                if (userItem) {
                    const newQuantity = userItem.quantity + amount; // amount is negative
                    if (newQuantity <= 0) {
                        await trx
                            .deleteFrom('user_items')
                            .where('user_id', '=', user_id)
                            .where('item_id', '=', item_id)
                            .execute();
                        amountAddedOrRemoved = -userItem.quantity; // All items were removed
                    }
                    else {
                        await trx
                            .updateTable('user_items')
                            .set({ quantity: newQuantity })
                            .where('user_id', '=', user_id)
                            .where('item_id', '=', item_id)
                            .execute();
                        amountAddedOrRemoved = amount; // The specified negative amount was removed
                    }
                }
            }
        });
        return amountAddedOrRemoved;
    }
    async setBalance(user_id, amount) {
        if (amount < 0)
            amount = 0;
        await this.set(user_id, {
            balance: amount
        });
    }
    async setActivityPoints(user_id, amount) {
        if (amount < 0)
            amount = 0;
        await this.set(user_id, {
            activity_points: amount
        });
    }
    async getBalance(user_id) {
        const user = await this.get(user_id);
        return user?.balance ?? 0;
    }
    async getArmor(user_id) {
        const user = await this.get(user_id);
        return user?.armor ?? 0;
    }
    async getActivityPoints(user_id) {
        const user = await this.get(user_id);
        return user?.activity_points ?? 0;
    }
    async getItemCount(user_id) {
        const items = await this.getItems(user_id);
        const itemCount = items?.reduce((previous, current) => {
            return previous + current.quantity;
        }, 0);
        return itemCount ?? 0;
    }
    async getItem(user_id, item_id) {
        const userItem = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id)
            .where('item_id', '=', item_id)
            .executeTakeFirst();
        return userItem;
    }
    async getItems(user_id) {
        const userItems = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id)
            .execute();
        return userItems;
    }
    async getPortfolioValue(user_id) {
        const Stocks = this.references.get('stocks');
        const userStocks = await this.getUserStocks(user_id);
        let portfolioValue = 0;
        for (const userStock of userStocks) {
            const latestPrice = (await Stocks.getLatestStock(userStock.stock_id)).price;
            portfolioValue += latestPrice * userStock.quantity;
        }
        return portfolioValue;
    }
    async getNetWorth(user_id) {
        const portfolioValue = await this.getPortfolioValue(user_id);
        const balance = await this.getBalance(user_id);
        return portfolioValue + balance;
    }
    async getPortfolio(user_id) {
        const Stocks = this.references.get('stocks');
        const userStock = await this.db
            .selectFrom('user_stocks')
            .select('stock_id')
            .where('user_id', '=', user_id)
            .distinct()
            .execute();
        // Populate with the latest stock information
        let stockPromises = [];
        for (const stock of userStock) {
            stockPromises.push(Stocks.getLatestStock(stock.stock_id));
        }
        return await Promise.all(stockPromises);
    }
    async getUserStocks(user_id, stock_id) {
        let query = this.db
            .selectFrom('user_stocks')
            .selectAll()
            .where('user_id', '=', user_id);
        query = stock_id ?
            query.where('stock_id', '=', stock_id) :
            query;
        return await query
            .orderBy('purchase_date desc')
            .execute();
    }
    async addStock(user_id, stock_id, amount) {
        let amountSoldOrBought = 0;
        await this.db.transaction().execute(async (trx) => {
            const Stocks = this.references.get('stocks');
            const currentStockPrice = (await Stocks.getLatestStock(stock_id))?.price;
            // prevents a user from being created and from inserting a non-existent stock
            if (currentStockPrice == undefined)
                return;
            if (amount > 0) {
                await this.set(user_id);
                // If amount is positive, insert a new record.
                await trx
                    .insertInto('user_stocks')
                    .values({
                    user_id: user_id,
                    stock_id: stock_id,
                    purchase_date: luxon_1.DateTime.now().toISO(),
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
                    .where('user_id', '=', user_id)
                    .where('stock_id', '=', stock_id)
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
                            .where('user_id', '=', user_id)
                            .where('stock_id', '=', stock_id)
                            .where('purchase_date', '=', userStock.purchase_date)
                            .execute();
                        remainingAmountToDecrement -= userStock.quantity; // Deduct the full quantity of this record
                    }
                    else {
                        // If decremented quantity is positive, update the record.
                        await trx
                            .updateTable('user_stocks')
                            .set({ quantity: decrementedQuantity })
                            .where('user_id', '=', user_id)
                            .where('stock_id', '=', stock_id)
                            .where('purchase_date', '=', userStock.purchase_date)
                            .execute();
                        remainingAmountToDecrement = 0; // Stop, as all amount has been decremented
                    }
                    amountSoldOrBought = amount - remainingAmountToDecrement;
                }
            }
        });
        return amountSoldOrBought;
    }
    async getRemainingCooldownDuration(user_id, command_id) {
        const Commands = this.references.get('commands');
        const command = await Commands.get(command_id);
        const cooldownAmount = command.cooldown_time;
        const userCooldown = await this.db
            .selectFrom('user_cooldowns')
            .select(['start_date'])
            .where('user_id', '=', user_id)
            .where('command_id', '=', command_id)
            .executeTakeFirst();
        if (userCooldown) {
            const startDateTime = luxon_1.DateTime.fromISO(userCooldown.start_date);
            if (!startDateTime.isValid) {
                console.error('Invalid start date:', userCooldown.start_date);
                return 0;
            }
            const expirationDateTime = startDateTime.plus({ milliseconds: cooldownAmount });
            const remainingDuration = expirationDateTime.diffNow('millisecond').milliseconds;
            if (remainingDuration <= 0) {
                await this.db
                    .deleteFrom('user_cooldowns')
                    .where('user_id', '=', user_id)
                    .where('command_id', '=', command_id)
                    .execute();
                return 0;
            }
            return remainingDuration;
        }
        return 0; // No cooldown found
    }
    async createCooldown(user_id, command_id) {
        await this.db
            .insertInto('user_cooldowns')
            .values({
            user_id: user_id,
            command_id: command_id,
            start_date: luxon_1.DateTime.now().toISO()
        })
            .execute();
    }
    constructor(db, references) {
        super(db, 'users', 'user_id', references);
    }
}
class Items extends DataStore {
    behaviors = new discord_js_1.Collection();
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
    async use(item_id, message, args) {
        const use = this.behaviors.get(item_id);
        await use(message, args);
    }
    constructor(db, references) {
        super(db, 'items', 'item_id', references);
    }
}
class Stocks extends DataStore {
    // caches the 'now' stock history for each stock
    async refreshCache() {
        const latestStocks = await this.getLatestStocks();
        console.log("Cache retrieved: ");
        console.log(latestStocks);
        for (const latestStock of latestStocks) {
            const stockHistory = await this.getStockHistory(latestStock.stock_id, 'now');
            console.log("Stock history: ");
            console.log(stockHistory);
            this.cache.set(latestStock[this.tableID], stockHistory);
        }
    }
    async getTotalSharesPurchased(stock_id) {
        const result = await this.db
            .selectFrom('user_stocks')
            .select(eb => eb.fn.sum('quantity').as('total_shares_purchased'))
            .where('stock_id', '=', stock_id)
            .executeTakeFirst();
        return Number(result.total_shares_purchased) ?? 0;
    }
    async getFromDB(id) {
        return await this.db
            .selectFrom('stocks')
            .selectAll()
            .where('stock_id', '=', id)
            .orderBy('created_date desc')
            .executeTakeFirst();
    }
    async set(id, data = {}) {
        const newData = {
            stock_id: id,
            created_date: data.created_date ?? luxon_1.DateTime.now().toISO(),
            ...data
        };
        await db.transaction().execute(async (trx) => {
            const result = await trx
                .insertInto('stocks')
                .values(newData)
                .returningAll()
                .executeTakeFirstOrThrow();
            let cachedStockHistory = this.cache.get(id);
            if (cachedStockHistory) {
                cachedStockHistory.pop();
                cachedStockHistory.unshift(result);
            }
            else {
                this.cache.set(id, [result]);
            }
        });
    }
    async updateStockPrice(stock_id, amount) {
        if (amount < 0)
            amount = 0;
        this.set(stock_id, { price: amount });
    }
    async getLatestStocks() {
        let latestStocks = [];
        if (this.cache.size) {
            for (const stockId of this.cache.keys()) {
                const stockCache = this.cache.get(stockId);
                if (stockCache[0]) {
                    latestStocks.push(stockCache[0]);
                }
            }
        }
        else {
            try {
                latestStocks = await this.db
                    .selectFrom('stocks as s1')
                    .selectAll()
                    .innerJoin(eb => eb
                    .selectFrom('stocks')
                    .select(['stock_id', eb => eb.fn.max('created_date').as('max_created_date')])
                    .groupBy('stock_id')
                    .as('s2'), join => join.onRef('s1.stock_id', '=', 's2.stock_id').onRef('s1.created_date', '=', 's2.max_created_date'))
                    .orderBy('s1.created_date', 'desc')
                    .execute();
            }
            catch (error) {
                console.error("Error getting latest stocks: ", error);
            }
        }
        return latestStocks;
    }
    async getLatestStock(stock_id) {
        return await this.get(stock_id);
    }
    async getStockHistory(stock_id, interval) {
        // only 'now' is stored in the cache currently
        if (interval === 'now' && this.getFromCache(stock_id)) {
            console.log("History cache");
            // cache hit on 'now'
            return this.cache.get(stock_id);
        }
        let intervalOffset;
        switch (interval) {
            case 'now':
                intervalOffset = { minutes: 60 };
                break;
            case 'hour':
                intervalOffset = { hours: 24 };
                break;
            case 'day':
                intervalOffset = { days: 30 };
                break;
            case 'month':
                intervalOffset = { months: 6 };
                break;
        }
        const oldestStockDate = luxon_1.DateTime.now().minus(intervalOffset).toISO();
        const stockHistory = await this.db
            .selectFrom('stocks as s1')
            .innerJoin(eb => eb
            .selectFrom('stocks')
            .select([
            'stock_id',
            eb => eb.fn.max('created_date').as('max_created_date'),
            eb => (0, kysely_1.sql) `extract(${kysely_1.sql.raw(interval === 'now' ? 'minute' : interval)} from ${eb.ref('created_date')})`.as('created_interval')
        ])
            .groupBy('created_interval')
            .groupBy('stock_id')
            .as('s2'), join => join.onRef('s1.stock_id', '=', 's2.stock_id').onRef('s1.created_date', '=', 's2.max_created_date'))
            .selectAll()
            .where('s1.stock_id', '=', stock_id)
            .where('s1.created_date', '>=', oldestStockDate)
            .orderBy('s1.created_date', 'desc')
            .execute();
        return stockHistory;
    }
    constructor(db, references) {
        super(db, 'stocks', 'stock_id', references);
    }
}
class Commands extends DataStore {
    behaviors = new discord_js_1.Collection();
    async refreshCache() {
        const foldersPath = path_1.default.join(process.cwd(), 'built/commands');
        const commandFolders = fs_1.default.readdirSync(foldersPath);
        for (const folder of commandFolders) {
            const commandsPath = path_1.default.join(foldersPath, folder);
            const commandFiles = fs_1.default.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path_1.default.join(commandsPath, file);
                const commandObj = (await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)))).default;
                if ('data' in commandObj && 'execute' in commandObj) {
                    this.behaviors.set(commandObj.data.command_id, commandObj.execute);
                    this.set(commandObj.data.command_id, commandObj.data);
                }
                else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }
    async execute(command_id, message, args) {
        const execute = this.behaviors.get(command_id);
        await execute(message, args);
    }
    constructor(db, references) {
        super(db, 'commands', 'command_id', references);
    }
}
const items = new Items(db);
exports.Items = items;
const stocks = new Stocks(db);
exports.Stocks = stocks;
const commands = new Commands(db);
exports.Commands = commands;
const userReferences = new discord_js_1.Collection([
    ['stocks', stocks],
    ['items', items],
    ['commands', commands]
]);
const users = new Users(db, userReferences);
exports.Users = users;
