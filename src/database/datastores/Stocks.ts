import { DataStore, DataStoreFactory, db } from "./DataStore";
import { UsersUserId } from "../schemas/public/Users";
import { Stocks as Stock, StocksCreatedDate, StocksGuildId } from "../schemas/public/Stocks";
import { DateTime } from "luxon";
import { Kysely, Updateable, Insertable, sql } from "kysely";
import Database from "../schemas/Database";
import { Collection } from "discord.js";
import { UserStocksGuildId } from "../schemas/public/UserStocks";

export function isStockInterval(a: any): a is StockInterval {
    const stockIntervals = ["minute", "hour", "day", "month"] as const;
    return stockIntervals.includes(a);
}
export type StockInterval = "minute" | "hour" | "day" | "month";

interface StockHistoryOptions {
    start?: DateTime,
    end?: DateTime,
    offset?: number
}

class Stocks extends DataStore<string, Stock> {
    constructor(db: Kysely<Database>, guildID: string) {
        super(db, "stocks", "stock_id", guildID);
    }

    async set(
        stock_id: string,
        data: Insertable<Stock> | Updateable<Stock> = {},
    ): Promise<void> {
        const newData: Stock = {
            stock_id: stock_id as UsersUserId,
            guild_id: this.guildID as StocksGuildId,
            ...data,
        } as Stock;

        const result: Stock = (await db
            .insertInto("stocks")
            .values(newData)
            .returningAll()
            .onConflict((oc) =>
                oc
                    .columns(["stock_id", "guild_id", "created_date"])
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
        price: number,
        date: DateTime = DateTime.now(),
    ): Promise<void> {
        if (price < 0) price = 1;

        await this.set(stock_id, {
            price: price,
            created_date: date.toUTC().toSQL() as StocksCreatedDate
        });
    }

    async getFromDB(
        stock_id: string,
    ): Promise<Stock | undefined> {
        return (await this.db
            .selectFrom("stocks")
            .selectAll()
            .where("stock_id", "=", stock_id as UsersUserId)
            .where("guild_id", "=", this.guildID as StocksGuildId)
            .orderBy("created_date desc")
            .limit(1)
            .executeTakeFirst()) as Stock;
    }

    async getTotalSharesPurchased(stock_id: string): Promise<number> {
        const result = await this.db
            .selectFrom("user_stocks")
            .select((eb) => eb.fn.sum("quantity").as("total_shares_purchased"))
            .where("stock_id", "=", stock_id as UsersUserId)
            .where("guild_id", "=", this.guildID as UserStocksGuildId)
            .executeTakeFirst();

        return Number(result.total_shares_purchased) ?? 0;
    }

    async getAll(): Promise<Stock[]> {
        let latestStocks: Stock[] = [];
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
                            .where("guild_id", "=", this.guildID as StocksGuildId)
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
                .where("guild_id", "=", this.guildID as StocksGuildId)
                .execute();
        } catch (error) {
            console.error("Error getting latest stocks: ", error);
        }
        return latestStocks;
    }

    async get(
        stock_id: string,
    ): Promise<Stock | undefined> {
        let latestStock = this.getFromCache(stock_id);
        if (!latestStock) {
            latestStock = await this.getFromDB(stock_id);
        }
        return latestStock;
    }

    async getStockHistory(
        stock_id: string,
        interval: StockInterval,
        opts: StockHistoryOptions = {}
    ): Promise<Stock[]> {
        // only 'minute' is stored in the cache assuming the current date
        const usingDefaultOptions = Object.values(opts).every(opt => opt == null);
        if (usingDefaultOptions && interval === "minute" && this.getFromCache(stock_id)) {
            // cache hit on 'minute'
            return this.cache.get(stock_id);
        }

        let intervalOffset: Object;
        switch (interval) {
            case "minute":
                intervalOffset = { minutes: opts.offset ?? 60 };
                break;
            case "hour":
                intervalOffset = { hours: opts.offset ?? 24 };
                break;
            case "day":
                intervalOffset = { days: opts.offset ?? 30 };
                break;
            case "month":
                intervalOffset = { months: opts.offset ?? 6 };
                break;
        }

        const latestStockDate = opts.end ?? DateTime.now();
        const oldestStockDate: DateTime = opts.start ?? latestStockDate.minus(intervalOffset);

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
                                sql`date_trunc(${interval}, ${eb.ref("created_date")})`.as(
                                    "created_interval",
                                )

                        ])
                        .where("guild_id", "=", this.guildID as StocksGuildId)
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
            .where("guild_id", "=", this.guildID as StocksGuildId)
            .where(
                "s1.created_date",
                ">=",
                oldestStockDate.toUTC().toSQL() as StocksCreatedDate,
            )
            .where(
                "s1.created_date",
                "<=",
                latestStockDate.toUTC().toSQL() as StocksCreatedDate,
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
            .where("guild_id", "=", this.guildID as StocksGuildId)
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
                                "created_day",
                            ),
                    ])
                    .where("guild_id", "=", this.guildID as StocksGuildId)
                    .groupBy("created_day")
                    .groupBy("stock_id")
                    .as("s2"),
            )
            .where("guild_id", "=", this.guildID as StocksGuildId)
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
        const latestStocks: Stock[] = await this.getAll();

        for (const latestStock of latestStocks) {
            const stockHistory: Stock[] = await this.getStockHistory(
                latestStock.stock_id,
                "minute",
                { end: date }
            );

            this.cache.set(latestStock.stock_id, stockHistory);
        }
    }

    protected cache = new Collection<string, Stock[]>;
}

class StocksFactory extends DataStoreFactory<Stocks> {
    protected construct(guildID: string): Stocks {
        return new Stocks(db, guildID);
    }
}

const stocksFactory = new StocksFactory(db);
export { stocksFactory as StocksFactory };
