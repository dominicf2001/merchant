import { Stocks, Users } from "@alias/db-objects";
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

describe('Stock History Operations', () => {
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
    
    test('Get stock history for "now" interval', async () => {
        const baselineDate = DateTime.now();
        
        for (let i = 0; i < 10; i++) {
            const fakeDate = baselineDate.minus({ minutes: i }).toISO();
            await Stocks.set(testStockId, { price: faker.number.int(100), created_date: fakeDate as StocksCreatedDate });
            await sleep(50);
        }

        const stockHistory = await Stocks.getStockHistory(testStockId, 'now');
        expect(stockHistory?.length).toBe(10);
    });
    
    // test('Get stock history for "hour" interval', async () => {
    //     for (let i = 0; i < 3; i++) {
    //         await Stocks.set(testStockId, { price: faker.number.int(100) });
    //         await sleep(1000);
    //     }

    //     const stockHistory = await Stocks.getStockHistory(testStockId, 'hour');
    //     expect(stockHistory.length).toBeGreaterThanOrEqual(3);
    // });
    
    // test('Get stock history for invalid interval', async () => {
    //     await expect(Stocks.getStockHistory(testStockId, 'invalid' as any)).rejects.toThrow();
    // });
});
