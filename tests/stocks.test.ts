import { Stocks, Users } from "@alias/db-objects";

describe('UPDATING Operations', () => {
    const testStockId = '123';
    const testUserId = testStockId;

    beforeAll(async () => {
        await Users.delete(testUserId);
        await Users.set(testUserId);
        await Stocks.delete(testStockId);
    });
    
    afterEach(async () => {
        await Stocks.delete(testStockId);
    });

    afterAll(async () => {
        await Users.delete(testUserId);
    });
    
    test('Update non-existing stock', async () => {
        await Stocks.updateStockPrice(testStockId, 20);

        let latestStock = await Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(20);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(20);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(20);
    });
    
    test('Update existing stock', async () => {
        await Stocks.set(testStockId, { price: 1 });
        
        await Stocks.updateStockPrice(testStockId, 30);
        let latestStock = await Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(30);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(30);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(30);
    });

    test('Update existing stock multiple times', async () => {
        await Stocks.set(testStockId, { price: 0 });

        await new Promise(r => setTimeout(r, 500));

        await Stocks.updateStockPrice(testStockId, 1000);

        await new Promise(r => setTimeout(r, 500));

        await Stocks.updateStockPrice(testStockId, 143);

        await new Promise(r => setTimeout(r, 500));

        await Stocks.updateStockPrice(testStockId, 250);

        let latestStock = await Stocks.getLatestStock(testStockId);
        expect(latestStock?.price).toBe(250);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(250);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(250);
    });
});

afterAll(() => {
    Users.destroyDB();
});
