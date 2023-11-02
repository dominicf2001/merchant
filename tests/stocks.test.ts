import { Stocks, Users, db } from "@alias/db-objects";
import { StocksCreatedDate } from "@alias/schemas/public/Stocks";
import { faker } from '@faker-js/faker';
import { DateTime } from "luxon";

async function sleep(duration: number): Promise<void> {
    await new Promise(r => setTimeout(r, duration));
}

const sleepDuration: number = 25;

describe('UPDATING Operations', () => {
    const testStockId = '123';
    const testUserId = testStockId;

    beforeAll(async () => {
        await Users.delete(testUserId);
        await sleep(sleepDuration);
        
        await Users.set(testUserId);
        await sleep(sleepDuration);
        
        await Stocks.delete(testStockId);
        await sleep(sleepDuration);
    });
    
    afterEach(async () => {
        await Stocks.delete(testStockId);
        await sleep(sleepDuration);
    });

    afterAll(async () => {
        await Users.delete(testUserId);
        await sleep(sleepDuration);
    }); 
    
    test('Update non-existing stock', async () => {
        await Stocks.updateStockPrice(testStockId, 20);
        await sleep(sleepDuration);

        let latestStock = await Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(20);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(20);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(20);
    });
    
    test('Update existing stock', async () => {
        await Stocks.set(testStockId, { price: 1 });
        await sleep(sleepDuration);
        
        await Stocks.updateStockPrice(testStockId, 30);
        await sleep(sleepDuration);
        
        let latestStock = await Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(30);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(30);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(30);
    });

    test('Update existing stock multiple times', async () => {
        await Stocks.set(testStockId, { price: 0 });
        await sleep(sleepDuration);

        await Stocks.updateStockPrice(testStockId, 1000);
        await sleep(sleepDuration);
        
        await Stocks.updateStockPrice(testStockId, 143);
        await sleep(sleepDuration);

        await Stocks.updateStockPrice(testStockId, 250);
        await sleep(sleepDuration);

        let latestStock = await Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(250);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(250);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(250);
    });
});

describe('HISTORY Operations', () => {
    const testStockId = '123';
    const testStockIdTwo = '4321';
    const testStockIdThree = '222222';

    beforeAll(async () => {
        await Users.delete(testStockId);
        await Users.delete(testStockIdTwo);
        await Users.delete(testStockIdThree);
        await sleep(sleepDuration);
        
        await Users.set(testStockId);
        await Users.set(testStockIdTwo);
        await Users.set(testStockIdThree);
        await sleep(sleepDuration);
        
        await Stocks.delete(testStockId);
        await Stocks.delete(testStockIdTwo);
        await Stocks.delete(testStockIdThree);
        await sleep(sleepDuration);
    });
    
    afterEach(async () => {
        await Stocks.delete(testStockId);
        await Stocks.delete(testStockIdTwo);
        await Stocks.delete(testStockIdThree);
        await sleep(sleepDuration);
    });

    afterAll(async () => {
        await Users.delete(testStockId);
        await Users.delete(testStockIdTwo);
        await Users.delete(testStockIdThree);
        await sleep(sleepDuration);
    }); 
    
    test('Get stock history for "now" interval', async () => {
        const baselineDate = DateTime.now();

        const stockDataOne = Array.from({ length: 10 }, (_, i) => ({
            stock_id: testStockId,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));
        
        const stockDataTwo = Array.from({ length: 4 }, (_, i) => ({
            stock_id: testStockIdTwo,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));

        const stockDataThree = Array.from({ length: 15 }, (_, i) => ({
            stock_id: testStockIdThree,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));

        await db.transaction().execute(async trx => {
            await Promise.all([
                trx.insertInto('stocks').values(stockDataOne).execute(),
                trx.insertInto('stocks').values(stockDataTwo).execute(),
                trx.insertInto('stocks').values(stockDataThree).execute(),
            ]);
        });

        const stockHistory = await Stocks.getStockHistory(testStockId, 'now');
        const stockHistoryTwo = await Stocks.getStockHistory(testStockIdTwo, 'now');
        // test cache hit
        Stocks.refreshCache();
        const stockHistoryThree = await Stocks.getStockHistory(testStockIdThree, 'now');
        expect(stockHistory?.length).toBe(10);
        expect(stockHistoryTwo?.length).toBe(4);
        expect(stockHistoryThree?.length).toBe(10);
    });


    test('Get stock history for "hour" interval', async () => {
        const baselineDate = DateTime.now();
        
        const stockDataOne = Array.from({ length: 1440 }, (_, i) => ({
            stock_id: testStockId,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));

        const stockDataTwo = Array.from({ length: 900 }, (_, i) => ({
            stock_id: testStockIdTwo,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));

        const stockDataThree = Array.from({ length: 2000 }, (_, i) => ({
            stock_id: testStockIdThree,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));
        
        await db.transaction().execute(async trx => {
            await Promise.all([
                trx.insertInto('stocks').values(stockDataOne).execute(),
                trx.insertInto('stocks').values(stockDataTwo).execute(),
                trx.insertInto('stocks').values(stockDataThree).execute(),
            ]);
        });
        
        const stockHistory = await Stocks.getStockHistory(testStockId, 'hour');
        const stockHistoryTwo = await Stocks.getStockHistory(testStockIdTwo, 'hour');
        const stockHistoryThree = await Stocks.getStockHistory(testStockIdThree, 'hour');
        expect(stockHistory?.length).toBe(24);
        expect(stockHistoryTwo?.length).toBe(16);
        expect(stockHistoryThree?.length).toBe(24);
    });

    test('Get latest stocks', async () => {
        const baselineDate = DateTime.now();
        
        const stockDataOne = Array.from({ length: 1440 }, (_, i) => ({
            stock_id: testStockId,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));

        const stockDataTwo = Array.from({ length: 900 }, (_, i) => ({
            stock_id: testStockIdTwo,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));

        const stockDataThree = Array.from({ length: 2000 }, (_, i) => ({
            stock_id: testStockIdThree,
            price: faker.number.int(100),
            created_date: baselineDate.minus({ minutes: i }).toISO() as StocksCreatedDate,
        }));
        
        await db.transaction().execute(async trx => {
            await Promise.all([
                trx.insertInto('stocks').values(stockDataOne).execute(),
                trx.insertInto('stocks').values(stockDataTwo).execute(),
                trx.insertInto('stocks').values(stockDataThree).execute(),
            ]);
        });
        
        const latestStocks = await Stocks.getLatestStocks();
        expect(latestStocks?.length).toBe(3);
        
        for (const latestStock of latestStocks) {
            const latestStockDate = DateTime.fromISO(latestStock.created_date);
            const stockHistory = await Stocks.getStockHistory(latestStock.stock_id, 'now');
            
            for (const stock of stockHistory) {
                const stockDate = DateTime.fromISO(stock.created_date);
                expect(latestStockDate >= stockDate).toBeTruthy();
            }
        }

        // test cache hit
        Stocks.refreshCache();
        const latestStocksFromCache = await Stocks.getLatestStocks();
        expect(latestStocksFromCache?.length).toBe(3);

        for (const latestStock of latestStocksFromCache) {
            const latestStockDate = DateTime.fromISO(latestStock.created_date);
            const stockHistory = await Stocks.getStockHistory(latestStock.stock_id, 'now');

            for (const stock of stockHistory) {
                const stockDate = DateTime.fromISO(stock.created_date);
                expect(latestStockDate >= stockDate).toBeTruthy();
            }
        }
    });
});

jest.setTimeout(10000);
