"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
const DataStore_1 = require("./DataStore");
const luxon_1 = require("luxon");
const Items_1 = require("./Items");
const Stocks_1 = require("./Stocks");
const Commands_1 = require("./Commands");
class Users extends DataStore_1.DataStore {
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
        let amountAdded = 0;
        await this.db.transaction().execute(async (trx) => {
            // Check if item exists
            const itemExists = !!(await Items_1.Items.get(item_id));
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
                amountAdded = amount;
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
                    const oldQuantity = userItem.quantity;
                    const newQuantity = oldQuantity + amount; // amount is negative
                    if (newQuantity <= 0) {
                        await trx
                            .deleteFrom('user_items')
                            .where('user_id', '=', user_id)
                            .where('item_id', '=', item_id)
                            .execute();
                        amountAdded = -oldQuantity; // All items were removed
                    }
                    else {
                        await trx
                            .updateTable('user_items')
                            .set({ quantity: newQuantity })
                            .where('user_id', '=', user_id)
                            .where('item_id', '=', item_id)
                            .execute();
                        amountAdded = amount;
                    }
                }
            }
        });
        return amountAdded;
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
        const userStocks = await this.getUserStocks(user_id);
        let portfolioValue = 0;
        for (const userStock of userStocks) {
            const latestPrice = (await Stocks_1.Stocks.getLatestStock(userStock.stock_id)).price;
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
        const userStock = await this.db
            .selectFrom('user_stocks')
            .select('stock_id')
            .where('user_id', '=', user_id)
            .distinct()
            .execute();
        // Populate with the latest stock information
        let stockPromises = [];
        for (const stock of userStock) {
            stockPromises.push(Stocks_1.Stocks.getLatestStock(stock.stock_id));
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
        let amountAdded = 0;
        await this.db.transaction().execute(async (trx) => {
            const currentStockPrice = (await Stocks_1.Stocks.getLatestStock(stock_id))?.price;
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
                amountAdded = amount;
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
                    amountAdded = amount + remainingAmountToDecrement;
                }
            }
        });
        return amountAdded;
    }
    async getRemainingCooldownDuration(user_id, command_id) {
        const command = await Commands_1.Commands.get(command_id);
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
    constructor(db) {
        super(db, 'users', 'user_id');
    }
}
const users = new Users(DataStore_1.db);
exports.Users = users;
