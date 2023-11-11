"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const faker_1 = require("@faker-js/faker");
const luxon_1 = require("luxon");
async function sleep(duration) {
    await new Promise(r => setTimeout(r, duration));
}
const sleepDuration = 25;
describe('UPDATING Operations', () => {
    const testStockId = '123';
    const testUserId = testStockId;
    beforeAll(async () => {
        await _database_1.Users.delete(testUserId);
        await sleep(sleepDuration);
        await _database_1.Users.set(testUserId);
        await sleep(sleepDuration);
        await _database_1.Stocks.delete(testStockId);
        await sleep(sleepDuration);
    });
    afterEach(async () => {
        await _database_1.Stocks.delete(testStockId);
        await sleep(sleepDuration);
    });
    afterAll(async () => {
        await _database_1.Users.delete(testUserId);
        await sleep(sleepDuration);
    });
    test('Update non-existing stock', async () => {
        await _database_1.Stocks.updateStockPrice(testStockId, 20);
        await sleep(sleepDuration);
        let latestStock = await _database_1.Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(20);
        latestStock = _database_1.Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(20);
        latestStock = await _database_1.Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(20);
    });
    test('Update existing stock', async () => {
        await _database_1.Stocks.set(testStockId, { price: 1 });
        await sleep(sleepDuration);
        await _database_1.Stocks.updateStockPrice(testStockId, 30);
        await sleep(sleepDuration);
        let latestStock = await _database_1.Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(30);
        latestStock = _database_1.Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(30);
        latestStock = await _database_1.Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(30);
    });
    test('Update existing stock multiple times', async () => {
        await _database_1.Stocks.set(testStockId, { price: 0 });
        await sleep(sleepDuration);
        await _database_1.Stocks.updateStockPrice(testStockId, 1000);
        await sleep(sleepDuration);
        await _database_1.Stocks.updateStockPrice(testStockId, 143);
        await sleep(sleepDuration);
        await _database_1.Stocks.updateStockPrice(testStockId, 250);
        await sleep(sleepDuration);
        let latestStock = await _database_1.Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(250);
        latestStock = _database_1.Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(250);
        latestStock = await _database_1.Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(250);
    });
});
describe('HISTORY Operations', () => {
    const testStockId = '123';
    const testStockIdTwo = '4321';
    const testStockIdThree = '222222';
    beforeAll(async () => {
        await _database_1.Users.delete(testStockId);
        await _database_1.Users.delete(testStockIdTwo);
        await _database_1.Users.delete(testStockIdThree);
        await sleep(sleepDuration);
        await _database_1.Users.set(testStockId);
        await _database_1.Users.set(testStockIdTwo);
        await _database_1.Users.set(testStockIdThree);
        await sleep(sleepDuration);
        await _database_1.Stocks.delete(testStockId);
        await _database_1.Stocks.delete(testStockIdTwo);
        await _database_1.Stocks.delete(testStockIdThree);
        await sleep(sleepDuration);
    });
    afterEach(async () => {
        await _database_1.Stocks.delete(testStockId);
        await _database_1.Stocks.delete(testStockIdTwo);
        await _database_1.Stocks.delete(testStockIdThree);
        await sleep(sleepDuration);
    });
    afterAll(async () => {
        await _database_1.Users.delete(testStockId);
        await _database_1.Users.delete(testStockIdTwo);
        await _database_1.Users.delete(testStockIdThree);
        await sleep(sleepDuration);
    });
    test('Get stock history for "now" interval', async () => {
        const baselineDate = luxon_1.DateTime.now();
        const stockDataOne = Array.from({ length: 10 }, (_, i) => ({
            stock_id: testStockId,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        const stockDataTwo = Array.from({ length: 4 }, (_, i) => ({
            stock_id: testStockIdTwo,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        const stockDataThree = Array.from({ length: 15 }, (_, i) => ({
            stock_id: testStockIdThree,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        await _database_1.db.transaction().execute(async (trx) => {
            await Promise.all([
                trx.insertInto('stocks').values(stockDataOne).execute(),
                trx.insertInto('stocks').values(stockDataTwo).execute(),
                trx.insertInto('stocks').values(stockDataThree).execute(),
            ]);
        });
        const stockHistory = await _database_1.Stocks.getStockHistory(testStockId, 'now');
        const stockHistoryTwo = await _database_1.Stocks.getStockHistory(testStockIdTwo, 'now');
        // test cache hit
        _database_1.Stocks.refreshCache();
        const stockHistoryThree = await _database_1.Stocks.getStockHistory(testStockIdThree, 'now');
        expect(stockHistory?.length).toBe(10);
        expect(stockHistoryTwo?.length).toBe(4);
        expect(stockHistoryThree?.length).toBe(10);
    });
    test('Get stock history for "hour" interval', async () => {
        const baselineDate = luxon_1.DateTime.now();
        const stockDataOne = Array.from({ length: 1440 }, (_, i) => ({
            stock_id: testStockId,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        const stockDataTwo = Array.from({ length: 900 }, (_, i) => ({
            stock_id: testStockIdTwo,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        const stockDataThree = Array.from({ length: 2000 }, (_, i) => ({
            stock_id: testStockIdThree,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        await _database_1.db.transaction().execute(async (trx) => {
            await Promise.all([
                trx.insertInto('stocks').values(stockDataOne).execute(),
                trx.insertInto('stocks').values(stockDataTwo).execute(),
                trx.insertInto('stocks').values(stockDataThree).execute(),
            ]);
        });
        const stockHistory = await _database_1.Stocks.getStockHistory(testStockId, 'hour');
        const stockHistoryTwo = await _database_1.Stocks.getStockHistory(testStockIdTwo, 'hour');
        const stockHistoryThree = await _database_1.Stocks.getStockHistory(testStockIdThree, 'hour');
        expect(stockHistory?.length).toBe(24);
        expect(stockHistoryTwo?.length).toBe(16);
        expect(stockHistoryThree?.length).toBe(24);
    });
    test('Get latest stocks', async () => {
        const baselineDate = luxon_1.DateTime.now();
        const stockDataOne = Array.from({ length: 1440 }, (_, i) => ({
            stock_id: testStockId,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        const stockDataTwo = Array.from({ length: 900 }, (_, i) => ({
            stock_id: testStockIdTwo,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        const stockDataThree = Array.from({ length: 2000 }, (_, i) => ({
            stock_id: testStockIdThree,
            price: faker_1.faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO(),
        }));
        await _database_1.db.transaction().execute(async (trx) => {
            await Promise.all([
                trx.insertInto('stocks').values(stockDataOne).execute(),
                trx.insertInto('stocks').values(stockDataTwo).execute(),
                trx.insertInto('stocks').values(stockDataThree).execute(),
            ]);
        });
        const latestStocks = await _database_1.Stocks.getLatestStocks();
        expect(latestStocks?.length).toBe(3);
        for (const latestStock of latestStocks) {
            const latestStockDate = luxon_1.DateTime.fromISO(latestStock.created_date);
            const stockHistory = await _database_1.Stocks.getStockHistory(latestStock.stock_id, 'now');
            for (const stock of stockHistory) {
                const stockDate = luxon_1.DateTime.fromISO(stock.created_date);
                expect(latestStockDate >= stockDate).toBeTruthy();
            }
        }
        // test cache hit
        _database_1.Stocks.refreshCache();
        const latestStocksFromCache = await _database_1.Stocks.getLatestStocks();
        expect(latestStocksFromCache?.length).toBe(3);
        for (const latestStock of latestStocksFromCache) {
            const latestStockDate = luxon_1.DateTime.fromISO(latestStock.created_date);
            const stockHistory = await _database_1.Stocks.getStockHistory(latestStock.stock_id, 'now');
            for (const stock of stockHistory) {
                const stockDate = luxon_1.DateTime.fromISO(stock.created_date);
                expect(latestStockDate >= stockDate).toBeTruthy();
            }
        }
    });
});
jest.setTimeout(10000);