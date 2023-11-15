"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../database/db-objects");
async function sleep(duration) {
    await new Promise(r => setTimeout(r, duration));
}
const sleepDuration = 50;
describe('BALANCE, ACTIVITY_POINTS, ARMOR Operations', () => {
    const userId = '123';
    beforeAll(async () => {
        await db_objects_1.Users.delete(userId);
        await sleep(sleepDuration);
    });
    afterEach(async () => {
        await db_objects_1.Users.delete(userId);
        await sleep(sleepDuration);
    });
    // ADDING + NON-EXISTING
    test('Add balance to a non-existing user', async () => {
        await db_objects_1.Users.addBalance(userId, 5);
        await sleep(sleepDuration);
        const balance = await db_objects_1.Users.getBalance(userId);
        expect(balance).toBe(5);
        let user = db_objects_1.Users.getFromCache(userId);
        expect(user?.balance).toBe(5);
        user = await db_objects_1.Users.getFromDB(userId);
        expect(user?.balance).toBe(5);
    });
    test('Add armor to a non-existing user', async () => {
        await db_objects_1.Users.addArmor(userId, 12);
        await sleep(sleepDuration);
        const armor = await db_objects_1.Users.getArmor(userId);
        expect(armor).toBe(12);
        let user = db_objects_1.Users.getFromCache(userId);
        expect(user?.armor).toBe(12);
        user = await db_objects_1.Users.getFromDB(userId);
        expect(user?.armor).toBe(12);
    });
    test('Add activity points to a non-existing user', async () => {
        await db_objects_1.Users.addActivityPoints(userId, 1);
        await sleep(sleepDuration);
        const activity = await db_objects_1.Users.getActivity(userId);
        expect(activity.activity_points_short).toBe(1);
        expect(activity.activity_points_long).toBe(1);
    });
    // SUBTRACTING + EXISTING
    test('Subtract balance from an existing user', async () => {
        await db_objects_1.Users.set(userId, { balance: 12 });
        await sleep(sleepDuration);
        await db_objects_1.Users.addBalance(userId, -4);
        await sleep(sleepDuration);
        const balance = await db_objects_1.Users.getBalance(userId);
        expect(balance).toBe(8);
        let user = db_objects_1.Users.getFromCache(userId);
        expect(user?.balance).toBe(8);
        user = await db_objects_1.Users.getFromDB(userId);
        expect(user?.balance).toBe(8);
    });
    test('Subtract armor from an existing user', async () => {
        await db_objects_1.Users.set(userId, { armor: 100 });
        await sleep(sleepDuration);
        await db_objects_1.Users.addArmor(userId, -30);
        await sleep(sleepDuration);
        const armor = await db_objects_1.Users.getArmor(userId);
        expect(armor).toBe(70);
        let user = db_objects_1.Users.getFromCache(userId);
        expect(user?.armor).toBe(70);
        user = await db_objects_1.Users.getFromDB(userId);
        expect(user?.armor).toBe(70);
    });
    test('Subtract activity points from an existing user', async () => {
        await db_objects_1.Users.setActivity(userId, { activity_points_short: 2, activity_points_long: 2 });
        await sleep(sleepDuration);
        await db_objects_1.Users.addActivityPoints(userId, -2);
        await sleep(sleepDuration);
        const activity = await db_objects_1.Users.getActivity(userId);
        expect(activity.activity_points_short).toBe(0);
        expect(activity.activity_points_long).toBe(0);
    });
    // SUBTRACTING BELOW ZERO
    test('Subtract balance from an existing user below zero', async () => {
        await db_objects_1.Users.set(userId, { balance: 101 });
        await sleep(sleepDuration);
        await db_objects_1.Users.addBalance(userId, -200);
        await sleep(sleepDuration);
        const balance = await db_objects_1.Users.getBalance(userId);
        expect(balance).toBe(0);
        let user = db_objects_1.Users.getFromCache(userId);
        expect(user?.balance).toBe(0);
        user = await db_objects_1.Users.getFromDB(userId);
        expect(user?.balance).toBe(0);
    });
    test('Subtract armor from an existing user below zero', async () => {
        await db_objects_1.Users.set(userId, { armor: 20 });
        await sleep(sleepDuration);
        await db_objects_1.Users.addArmor(userId, -21);
        await sleep(sleepDuration);
        const armor = await db_objects_1.Users.getArmor(userId);
        expect(armor).toBe(0);
        let user = db_objects_1.Users.getFromCache(userId);
        expect(user?.armor).toBe(0);
        user = await db_objects_1.Users.getFromDB(userId);
        expect(user?.armor).toBe(0);
    });
    test('Subtract activity points from an existing user below zero', async () => {
        await db_objects_1.Users.setActivity(userId, { activity_points_short: 1, activity_points_long: 1 });
        await sleep(sleepDuration);
        await db_objects_1.Users.addActivityPoints(userId, -1000);
        await sleep(sleepDuration);
        const activity = await db_objects_1.Users.getActivity(userId);
        expect(activity.activity_points_short).toBe(0);
        expect(activity.activity_points_long).toBe(0);
    });
});
describe('User item operations', () => {
    const userId = '123';
    const itemId = 'test item one';
    const itemTwoId = 'test item two';
    beforeAll(async () => {
        await db_objects_1.Items.set(itemId);
        await db_objects_1.Items.set(itemTwoId);
        await db_objects_1.Users.delete(userId);
        await sleep(sleepDuration);
    });
    afterEach(async () => {
        await db_objects_1.Users.delete(userId);
        await sleep(sleepDuration);
    });
    afterAll(async () => {
        await db_objects_1.Items.delete(itemId);
        await db_objects_1.Items.delete(itemTwoId);
        await sleep(sleepDuration);
    });
    test('Add item to a non-existing user', async () => {
        await db_objects_1.Users.addItem(userId, itemId, 1);
        await sleep(sleepDuration);
        const itemOne = await db_objects_1.Users.getItem(userId, itemId);
        const items = await db_objects_1.Users.getItems(userId);
        expect(itemOne?.quantity).toBe(1);
        expect(items).toContainEqual(itemOne);
    });
    test('Add multiple items to an existing user', async () => {
        await db_objects_1.Users.set(userId);
        await sleep(sleepDuration);
        await db_objects_1.Users.addItem(userId, itemId, 1);
        await sleep(sleepDuration);
        await db_objects_1.Users.addItem(userId, itemTwoId, 1);
        await sleep(sleepDuration);
        await db_objects_1.Users.addItem(userId, itemTwoId, 1);
        await sleep(sleepDuration);
        const itemOne = await db_objects_1.Users.getItem(userId, itemId);
        const itemTwo = await db_objects_1.Users.getItem(userId, itemTwoId);
        const items = await db_objects_1.Users.getItems(userId);
        expect(itemOne?.quantity).toBe(1);
        expect(itemTwo?.quantity).toBe(2);
        expect(items).toContainEqual(itemOne);
        expect(items).toContainEqual(itemTwo);
    });
    test('Delete item from a non-existing user', async () => {
        await db_objects_1.Users.addItem(userId, itemId, -1);
        await sleep(sleepDuration);
        expect((await db_objects_1.Users.get(userId))).not.toBeDefined();
    });
    test('Delete item from a existing user with items, below zero and non-below zero', async () => {
        await db_objects_1.Users.set(userId);
        await sleep(sleepDuration);
        await db_objects_1.Users.addItem(userId, itemId, 5);
        await sleep(sleepDuration);
        await db_objects_1.Users.addItem(userId, itemTwoId, 10);
        await sleep(sleepDuration);
        await db_objects_1.Users.addItem(userId, itemId, -5);
        await sleep(sleepDuration);
        await db_objects_1.Users.addItem(userId, itemTwoId, -9);
        await sleep(sleepDuration);
        const itemOne = await db_objects_1.Users.getItem(userId, itemId);
        const itemTwo = await db_objects_1.Users.getItem(userId, itemTwoId);
        const items = await db_objects_1.Users.getItems(userId);
        expect(itemOne).not.toBeDefined();
        expect(itemTwo?.quantity).toBe(1);
        expect(items).not.toContainEqual(itemOne);
        expect(items).toContainEqual(itemTwo);
    });
    test('Removing and adding a non-existing item', async () => {
        const fakeItemId = '1111';
        db_objects_1.Users.addItem(userId, fakeItemId, -1);
        expect((await db_objects_1.Users.get(userId))).toBeUndefined();
        expect((await db_objects_1.Items.get(fakeItemId))).toBeUndefined();
        db_objects_1.Users.addItem(userId, fakeItemId, 1);
        expect((await db_objects_1.Users.get(userId))).toBeUndefined();
        expect((await db_objects_1.Items.get(fakeItemId))).toBeUndefined();
        await db_objects_1.Users.set(userId);
        await sleep(sleepDuration);
        db_objects_1.Users.addItem(userId, fakeItemId, -1);
        expect((await db_objects_1.Items.get(fakeItemId))).toBeUndefined();
        db_objects_1.Users.addItem(userId, fakeItemId, 1);
        expect((await db_objects_1.Items.get(fakeItemId))).toBeUndefined();
    });
});
describe("User stock operations", () => {
    const userId = '123';
    const stockId = '321';
    const stockTwoId = '4321';
    beforeAll(async () => {
        await db_objects_1.Users.delete(userId);
        await db_objects_1.Users.delete(stockId);
        await db_objects_1.Users.delete(stockTwoId);
        await sleep(sleepDuration);
        await db_objects_1.Users.set(stockId);
        await db_objects_1.Users.set(stockTwoId);
        await sleep(sleepDuration);
    });
    afterEach(async () => {
        await db_objects_1.Users.delete(userId);
        await db_objects_1.Stocks.delete(stockId);
        await db_objects_1.Stocks.delete(stockTwoId);
        await sleep(sleepDuration);
    });
    test('Add stock to a non-existing user', async () => {
        // initialize stock
        await db_objects_1.Stocks.updateStockPrice(stockId, 50);
        await sleep(sleepDuration);
        await db_objects_1.Users.addStock(userId, stockId, 1);
        await sleep(sleepDuration);
        const portfolio = await db_objects_1.Users.getPortfolio(userId);
        const userStocks = await db_objects_1.Users.getUserStocks(userId, stockId);
        expect(portfolio?.length).toBe(1);
        expect(portfolio[0]?.price).toBe(50);
        expect((await db_objects_1.Users.getPortfolioValue(userId))).toBe(50);
        expect(userStocks?.length).toBe(1);
        expect(userStocks[0]?.quantity).toBe(1);
        expect(userStocks[0]?.purchase_price).toBe(50);
        expect((await db_objects_1.Stocks.getTotalSharesPurchased(stockId))).toBe(1);
    });
    test('Add multiple stocks to an existing user', async () => {
        // initialize stocks
        await db_objects_1.Stocks.updateStockPrice(stockId, 100);
        await db_objects_1.Stocks.updateStockPrice(stockTwoId, 5);
        await sleep(sleepDuration);
        await db_objects_1.Users.set(userId);
        await sleep(sleepDuration);
        // stock one and two
        await db_objects_1.Users.addStock(userId, stockId, 4);
        await db_objects_1.Users.addStock(userId, stockTwoId, 1);
        await sleep(sleepDuration);
        await db_objects_1.Stocks.updateStockPrice(stockTwoId, 9);
        await sleep(sleepDuration);
        await db_objects_1.Users.addStock(userId, stockTwoId, 3);
        await sleep(sleepDuration);
        // queries
        const portfolio = await db_objects_1.Users.getPortfolio(userId);
        const portfolioStock = portfolio.find(stock => stock.stock_id === stockId);
        const portfolioStockTwo = portfolio.find(stock => stock.stock_id === stockTwoId);
        const userStocks = await db_objects_1.Users.getUserStocks(userId, stockId);
        const userStocksTwo = await db_objects_1.Users.getUserStocks(userId, stockTwoId);
        // test portfolio
        expect(portfolio?.length).toBe(2);
        expect(portfolioStock?.price).toBe(100);
        expect(portfolioStockTwo?.price).toBe(9);
        // test value
        expect((await db_objects_1.Users.getPortfolioValue(userId))).toBe(436);
        // test user stocks
        expect(userStocks?.length).toBe(1);
        expect(userStocks[0]?.quantity).toBe(4);
        expect(userStocks[0]?.purchase_price).toBe(100);
        expect(userStocksTwo?.length).toBe(2);
        expect(userStocksTwo[0]?.quantity).toBe(3);
        expect(userStocksTwo[0]?.purchase_price).toBe(9);
        expect(userStocksTwo[1]?.quantity).toBe(1);
        expect(userStocksTwo[1]?.purchase_price).toBe(5);
        // test total shares purchased
        expect((await db_objects_1.Stocks.getTotalSharesPurchased(stockId))).toBe(4);
        expect((await db_objects_1.Stocks.getTotalSharesPurchased(stockTwoId))).toBe(4);
    });
    test('Delete stock from a non-existing user', async () => {
        await db_objects_1.Stocks.updateStockPrice(stockId, 1);
        await sleep(sleepDuration);
        await db_objects_1.Users.addStock(userId, stockId, -1);
        await sleep(sleepDuration);
        expect((await db_objects_1.Users.get(userId))).toBeUndefined();
        expect((await db_objects_1.Users.getPortfolio(userId)).length).toBe(0);
    });
    test('Delete stock from a existing user with stocks, below zero and non-below zero', async () => {
        // initialization
        await db_objects_1.Users.set(userId);
        await sleep(sleepDuration);
        await db_objects_1.Stocks.updateStockPrice(stockId, 500);
        await db_objects_1.Stocks.updateStockPrice(stockTwoId, 1000);
        await sleep(sleepDuration);
        // add stock one and two
        await db_objects_1.Users.addStock(userId, stockId, 100);
        await db_objects_1.Users.addStock(userId, stockId, 10);
        await db_objects_1.Users.addStock(userId, stockTwoId, 50);
        await db_objects_1.Users.addStock(userId, stockTwoId, 25);
        await db_objects_1.Users.addStock(userId, stockTwoId, 5);
        await sleep(sleepDuration);
        // remove from stock one and two
        await db_objects_1.Users.addStock(userId, stockId, -80);
        await db_objects_1.Users.addStock(userId, stockTwoId, -100);
        await sleep(sleepDuration);
        // queries
        const portfolio = await db_objects_1.Users.getPortfolio(userId);
        const portfolioStock = portfolio.find(stock => stock.stock_id === stockId);
        const portfolioStockTwo = portfolio.find(stock => stock.stock_id === stockTwoId);
        const userStocks = await db_objects_1.Users.getUserStocks(userId, stockId);
        const userStocksTwo = await db_objects_1.Users.getUserStocks(userId, stockTwoId);
        // test portfolio
        expect(portfolio?.length).toBe(1);
        expect(portfolioStock?.price).toBe(500);
        expect(portfolioStockTwo).toBeUndefined();
        // test value
        expect((await db_objects_1.Users.getPortfolioValue(userId))).toBe(15000);
        // test user stocks
        expect(userStocks?.length).toBe(1);
        expect(userStocks[0]?.quantity).toBe(30);
        expect(userStocks[0]?.purchase_price).toBe(500);
        expect(userStocksTwo?.length).toBe(0);
    });
    test('Removing and adding a non-existing stock', async () => {
        db_objects_1.Users.addStock(userId, stockId, -1);
        expect((await db_objects_1.Users.get(userId))).toBeUndefined();
        expect((await db_objects_1.Stocks.get(stockId))).toBeUndefined();
        db_objects_1.Users.addStock(userId, stockId, 1);
        expect((await db_objects_1.Users.get(userId))).toBeUndefined();
        expect((await db_objects_1.Stocks.get(stockId))).toBeUndefined();
        await db_objects_1.Users.set(userId);
        await sleep(sleepDuration);
        db_objects_1.Users.addStock(userId, stockId, -1);
        expect((await db_objects_1.Stocks.get(stockId))).toBeUndefined();
        db_objects_1.Users.addStock(userId, stockId, 1);
        expect((await db_objects_1.Stocks.get(stockId))).toBeUndefined();
    });
});
