import { sleep } from "../utilities";
import { db, getDatastores } from "../database/db-objects";
import { StocksCreatedDate } from "../database/schemas/public/Stocks";
import { faker } from "@faker-js/faker";
import { DateTime } from "luxon";

const guildId = "4321";

const { Users, Stocks } = getDatastores(guildId);

const sleepDuration: number = 80;

describe("UPDATING Operations", () => {
    const testStockId = "1235";
    const testUserId = testStockId;

    beforeAll(async () => {
        for (const ds of Object.values(getDatastores(guildId))) {
            ds.isTesting = true;
        }

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

    test("Update non-existing stock", async () => {
        await Stocks.updateStockPrice(testStockId, 20);
        await sleep(sleepDuration);

        let latestStock = await Stocks.get(testStockId);
        expect(latestStock?.price).toBe(20);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(20);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(20);
    });

    test("Update existing stock", async () => {
        await Stocks.set(testStockId, { price: 1 });
        await sleep(sleepDuration);

        await Stocks.updateStockPrice(testStockId, 30);
        await sleep(sleepDuration);

        let latestStock = await Stocks.get(testStockId);
        expect(latestStock?.price).toBe(30);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(30);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(30);
    });

    test("Update existing stock multiple times", async () => {
        await Stocks.set(testStockId, { price: 0 });
        await sleep(sleepDuration);

        await Stocks.updateStockPrice(testStockId, 1000);
        await sleep(sleepDuration);

        await Stocks.updateStockPrice(testStockId, 143);
        await sleep(sleepDuration);

        await Stocks.updateStockPrice(testStockId, 250);
        await sleep(sleepDuration);

        let latestStock = await Stocks.get(testStockId);
        expect(latestStock?.price).toBe(250);

        latestStock = Stocks.getFromCache(testStockId);
        expect(latestStock?.price).toBe(250);

        latestStock = await Stocks.getFromDB(testStockId);
        expect(latestStock?.price).toBe(250);
    });
});

describe("HISTORY Operations", () => {
    const testStockId = "123";
    const testStockIdTwo = "4321";
    const testStockIdThree = "222222";

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

    test('Get stock history for "minute" interval', async () => {
        const baselineDate = DateTime.now();

        const stockDataOne = Array.from({ length: 10 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockId,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataTwo = Array.from({ length: 4 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdTwo,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataThree = Array.from({ length: 15 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdThree,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        await db.transaction().execute(async (trx) => {
            await Promise.all([
                trx.insertInto("stocks").values(stockDataOne).execute(),
                trx.insertInto("stocks").values(stockDataTwo).execute(),
                trx.insertInto("stocks").values(stockDataThree).execute(),
            ]);
        });

        const stockHistory = await Stocks.getStockHistory(testStockId, "minute");
        const stockHistoryTwo = await Stocks.getStockHistory(
            testStockIdTwo,
            "minute",
        );
        // test cache hit
        await Stocks.refreshCache();
        const stockHistoryThree = await Stocks.getStockHistory(
            testStockIdThree,
            "minute",
        );
        expect(stockHistory?.length).toBe(10);
        expect(stockHistoryTwo?.length).toBe(4);
        expect(stockHistoryThree?.length).toBe(15);
    });

    test('Get stock history for "hour" interval', async () => {
        const baselineDate = DateTime.now();

        const stockDataOne = Array.from({ length: 1440 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockId,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataTwo = Array.from({ length: 900 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdTwo,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataThree = Array.from({ length: 2000 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdThree,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        await db.transaction().execute(async (trx) => {
            await Promise.all([
                trx.insertInto("stocks").values(stockDataOne).execute(),
                trx.insertInto("stocks").values(stockDataTwo).execute(),
                trx.insertInto("stocks").values(stockDataThree).execute(),
            ]);
        });

        const stockHistory = await Stocks.getStockHistory(testStockId, "hour");
        const stockHistoryTwo = await Stocks.getStockHistory(
            testStockIdTwo,
            "hour",
        );
        const stockHistoryThree = await Stocks.getStockHistory(
            testStockIdThree,
            "hour",
        );

        expect(stockHistory?.length).toBe(25);
        expect(stockHistoryTwo?.length).toBe(16);
        expect(stockHistoryThree?.length).toBe(25);
    });

    test("Get latest stocks", async () => {
        const baselineDate = DateTime.now();

        const stockDataOne = Array.from({ length: 1440 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockId,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataTwo = Array.from({ length: 900 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdTwo,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataThree = Array.from({ length: 2000 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdThree,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        await db.transaction().execute(async (trx) => {
            await Promise.all([
                trx.insertInto("stocks").values(stockDataOne).execute(),
                trx.insertInto("stocks").values(stockDataTwo).execute(),
                trx.insertInto("stocks").values(stockDataThree).execute(),
            ]);
        });

        const latestStocks = await Stocks.getAll();
        expect(latestStocks?.length).toBe(3);

        for (const latestStock of latestStocks) {
            const latestStockDate = DateTime.fromSQL(latestStock.created_date);
            const stockHistory = await Stocks.getStockHistory(
                latestStock.stock_id,
                "minute",
            );

            for (const stock of stockHistory) {
                const stockDate = DateTime.fromSQL(stock.created_date);
                expect(latestStockDate >= stockDate).toBeTruthy();
            }
        }

        // test cache hit
        await Stocks.refreshCache();
        const latestStocksFromCache = await Stocks.getAll();
        expect(latestStocksFromCache?.length).toBe(3);

        for (const latestStock of latestStocksFromCache) {
            const latestStockDate = DateTime.fromSQL(latestStock.created_date);
            const stockHistory = await Stocks.getStockHistory(
                latestStock.stock_id,
                "minute",
            );

            for (const stock of stockHistory) {
                const stockDate = DateTime.fromSQL(stock.created_date);
                expect(latestStockDate >= stockDate).toBeTruthy();
            }
        }
    });

    test("Clean up stocks", async () => {
        const baselineDate = DateTime.now();

        const stockDataOne = Array.from({ length: 1440 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockId,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataTwo = Array.from({ length: 900 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdTwo,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i, days: 1 })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        const stockDataThree = Array.from({ length: 2000 }, (_, i) => ({
            guild_id: guildId,
            stock_id: testStockIdThree,
            price: faker.number.int(100),
            created_date: baselineDate
                .minus({ minutes: i, days: 3 })
                .toUTC().toSQL() as StocksCreatedDate,
        }));

        await db.transaction().execute(async (trx) => {
            await Promise.all([
                trx.insertInto("stocks").values(stockDataOne).execute(),
                trx.insertInto("stocks").values(stockDataTwo).execute(),
                trx.insertInto("stocks").values(stockDataThree).execute(),
            ]);
        });

        await Stocks.cleanUpStocks();
        await sleep(sleepDuration * 2);

        await db.transaction().execute(async (trx) => {
            const stocks = await trx.selectFrom("stocks").selectAll().execute();

            expect(stocks.length).toBe(3);
        });
    });
});

jest.setTimeout(10000);
