import { DataStore, db } from "./DataStore";
import { UsersUserId } from "../schemas/public/Users";
import { Stocks as Stock, StocksCreatedDate } from "../schemas/public/Stocks";
import { DateTime } from "luxon";
import { Kysely, Updateable, Insertable, sql } from "kysely";
import Database from "../schemas/Database";
import { Users } from "./Users";
import { Collection } from "discord.js";

export function isStockInterval(a: any): a is StockInterval {
    const stockIntervals = ["now", "hour", "day", "month"] as const;
    return stockIntervals.includes(a);
}
export type StockInterval = "now" | "hour" | "day" | "month";

class Stocks extends DataStore<string, Stock> {
    constructor(db: Kysely<Database>) {
        super(db, "stocks", "stock_id");
        this.refreshCache();
    }

    async set(
        stock_id: string,
        data: Insertable<Stock> | Updateable<Stock> = {},
    ): Promise<void> {
        // create the user associated with this stock if they dont exist
        if (!Users.getFromCache(stock_id)) {
            await Users.set(stock_id);
        }

        const newData: Stock = {
            stock_id: stock_id as UsersUserId,
            ...data,
        } as Stock;

        const result: Stock = (await db
            .insertInto("stocks")
            .values(newData)
            .returningAll()
            .onConflict((oc) =>
                oc
                    .columns(["stock_id", "created_date"])
                    .doUpdateSet(newData),
            )
            .executeTakeFirstOrThrow()) as Stock;

        let cachedStockHistory = this.cache.get(stock_id);
        if (!cachedStockHistory) {
            this.cache.set(stock_id, [result]);
        } else if (cachedStockHistory.length >= 12) {
            cachedStockHistory.pop();
            cachedStockHistory.unshift(result);
        } else {
            cachedStockHistory.unshift(result);
        }
    }

    async updateStockPrice(
        stock_id: string,
        amount: number,
        date: DateTime = DateTime.now(),
    ): Promise<void> {
        if (amount < 0) amount = 0;

        await this.set(stock_id, {
            price: amount,
            created_date: date.toISO() as StocksCreatedDate
        });
    }

    async get(
        stock_id: string,
    ): Promise<Stock | undefined> {
        if (this.cache.has(stock_id)) {
            // cache hit
            return this.getFromCache(stock_id);
        } else {
            // cache miss
            return await this.getFromDB(stock_id);
        }
    }

    async getFromDB(
        stock_id: string,
    ): Promise<Stock | undefined> {
        return (await this.db
            .selectFrom("stocks")
            .selectAll()
            .where("stock_id", "=", stock_id as UsersUserId)
            .orderBy("created_date desc")
            .executeTakeFirst()) as Stock;
    }

    async getTotalSharesPurchased(stock_id: string): Promise<number> {
        const result = await this.db
            .selectFrom("user_stocks")
            .select((eb) => eb.fn.sum("quantity").as("total_shares_purchased"))
            .where("stock_id", "=", stock_id as UsersUserId)
            .executeTakeFirst();

        return Number(result.total_shares_purchased) ?? 0;
    }

    async getLatestStocks(): Promise<Stock[]> {
        let latestStocks: Stock[] = [];
        // How can cache undefined???
        if (this.cache?.size) {
            for (const stockId of this.cache.keys()) {
                const stockCache = this.cache.get(stockId);
                if (stockCache[0]) {
                    latestStocks.push(stockCache[0]);
                }
            }
        } else {
            try {
                latestStocks = await this.db
                    .selectFrom("stocks as s1")
                    .selectAll()
                    .innerJoin(
                        (eb) =>
                            eb
                                .selectFrom("stocks")
                                .select([
                                    "stock_id",
                                    (eb) =>
                                        eb.fn
                                            .max("created_date")
                                            .as("max_created_date"),
                                ])
                                .groupBy("stock_id")
                                .as("s2"),
                        (join) =>
                            join
                                .onRef("s1.stock_id", "=", "s2.stock_id")
                                .onRef(
                                    "s1.created_date",
                                    "=",
                                    "s2.max_created_date",
                                ),
                    )
                    .orderBy("s1.created_date", "desc")
                    .execute();
            } catch (error) {
                console.error("Error getting latest stocks: ", error);
            }
        }
        return latestStocks;
    }

    async getLatestStock(
        stock_id: string,
    ): Promise<Stock | undefined> {
        return await this.get(stock_id);
    }

    async getStockHistory(
        stock_id: string,
        interval: StockInterval,
        date: DateTime = DateTime.now(),
    ): Promise<Stock[]> {
        console.log({ interval });
        // only 'now' is stored in the cache currently
        if (interval === "now" && this.getFromCache(stock_id)) {
            console.log("cache hit ");
            // cache hit on 'now'
            return this.cache.get(stock_id);
        }
        console.log("cache miss");

        let intervalOffset: Object;
        switch (interval) {
            case "now":
                intervalOffset = { minutes: 60 };
                break;
            case "hour":
                intervalOffset = { hours: 24 };
                break;
            case "day":
                intervalOffset = { days: 30 };
                break;
            case "month":
                intervalOffset = { months: 6 };
                break;
        }

        console.log({ intervalOffset });

        const oldestStockDate: string = date.minus(intervalOffset).toISO();
        console.log({ date: date.toString() });
        console.log({ oldestStockDate });

        const stockHistory: Stock[] = await this.db
            .selectFrom("stocks as s1")
            .innerJoin(
                (eb) =>
                    eb
                        .selectFrom("stocks")
                        .select([
                            "stock_id",
                            (eb) =>
                                eb.fn
                                    .max("created_date")
                                    .as("max_created_date"),
                            (eb) =>
                                sql`extract(${sql.raw(interval === "now" ? "minute" : interval)} from ${eb.ref("created_date")})`.as(
                                    "created_interval",
                                ),
                        ])
                        .groupBy("created_interval")
                        .groupBy("stock_id")
                        .as("s2"),
                (join) =>
                    join
                        .onRef("s1.stock_id", "=", "s2.stock_id")
                        .onRef("s1.created_date", "=", "s2.max_created_date"),
            )
            .selectAll()
            .where("s1.stock_id", "=", stock_id as UsersUserId)
            .where(
                "s1.created_date",
                ">=",
                oldestStockDate as StocksCreatedDate,
            )
            .orderBy("s1.created_date", "desc")
            .execute();

        return stockHistory;
    }

    async delete(
        stock_id: string,
    ): Promise<void> {
        this.cache.delete(stock_id);
        await this.db
            .deleteFrom("stocks")
            .where("stock_id", "=", stock_id as UsersUserId)
            .execute();
    }

    async cleanUpStocks() {
        await this.db
            .deleteFrom("stocks as s1")
            .using((eb) =>
                eb
                    .selectFrom("stocks")
                    .select([
                        "stock_id",
                        (eb) =>
                            eb.fn.max("created_date").as("max_created_date"),
                        (eb) =>
                            sql`extract(day from ${eb.ref("created_date")})`.as(
                                "created_interval",
                            ),
                    ])
                    .groupBy("created_interval")
                    .groupBy("stock_id")
                    .as("s2"),
            )
            .whereRef("s1.stock_id", "=", "s2.stock_id")
            .whereRef("s1.created_date", "<", "s2.max_created_date")
            .execute();
    }

    setInCache(id: string, stock: Stock): void {
        this.cache.set(id, [stock]);
    }

    getFromCache(id: string): Stock | undefined {
        return this.cache.get(id)?.[0];
    }

    // caches the 'now' stock history for each stock
    async refreshCache(date: DateTime = DateTime.now()): Promise<void> {
        const latestStocks: Stock[] = await this.getLatestStocks();

        for (const latestStock of latestStocks) {
            const stockHistory: Stock[] = await this.getStockHistory(
                latestStock.stock_id,
                "now",
                date
            );
            this.cache.set(latestStock[this.tableID], stockHistory);
        }
    }

    protected cache = new Collection<string, Stock[]>;
}

const stocks = new Stocks(db);
export { stocks as Stocks };
