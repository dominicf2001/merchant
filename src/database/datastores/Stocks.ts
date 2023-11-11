import { DataStore, db } from './DataStore';
import { UsersUserId } from '../schemas/public/Users';
import { Stocks as Stock, StocksCreatedDate } from '../schemas/public/Stocks';
import { DateTime } from 'luxon';
import { Kysely, Updateable, Insertable, sql } from 'kysely';
import Database from '../schemas/Database';
import { Users } from './Users';

export type StockInterval = 'now' | 'hour' | 'day' | 'month';

class Stocks extends DataStore<Stock> {
    // caches the 'now' stock history for each stock
    async refreshCache(): Promise<void> {
        const latestStocks: Stock[] = await this.getLatestStocks();
        console.log("Cache retrieved: ");
        console.log(latestStocks);
        
        for (const latestStock of latestStocks) {
            const stockHistory: Stock[] = await this.getStockHistory(latestStock.stock_id, 'now');
            console.log("Stock history: ");
            console.log(stockHistory);
            this.cache.set(latestStock[this.tableID], stockHistory)   
        }
    }

    async getTotalSharesPurchased(stock_id: string): Promise<number> {
        const result = await this.db
            .selectFrom('user_stocks')
            .select(eb => eb.fn.sum('quantity').as('total_shares_purchased'))
            .where('stock_id', '=', stock_id as UsersUserId)
            .executeTakeFirst();

        return Number(result.total_shares_purchased) ?? 0;
    }

    async getFromDB(id: string): Promise<Stock | undefined> {
        return await this.db
            .selectFrom('stocks')
            .selectAll()
            .where('stock_id', '=', id as UsersUserId)
            .orderBy('created_date desc')
            .executeTakeFirst() as Stock;
    }

    async set(id: string, data: Insertable<Stock> | Updateable<Stock> = {}): Promise<void> {
        // create the user associated with this stock if they dont exist
        await Users.set(id);
        
        const newData: Stock = {
            stock_id: id as UsersUserId,
            created_date: data.created_date ?? DateTime.now().toISO() as StocksCreatedDate,
            ...data
        } as Stock;

        await db.transaction().execute(async (trx) => {
            const result: Stock = await trx
                .insertInto('stocks')
                .values(newData)
                .returningAll()
                .executeTakeFirstOrThrow() as Stock;

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
    
    async updateStockPrice(stock_id: string, amount: number): Promise<void> {
        if (amount < 0) amount = 0;

        this.set(stock_id, { price: amount });
    }
    
    async getLatestStocks(): Promise<Stock[]> {
        let latestStocks: Stock[] = [];
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
                    .innerJoin(
                        eb => eb
                            .selectFrom('stocks')
                            .select(['stock_id', eb => eb.fn.max('created_date').as('max_created_date')])
                            .groupBy('stock_id')
                            .as('s2'),
                        join => join.onRef('s1.stock_id', '=', 's2.stock_id').onRef('s1.created_date', '=', 's2.max_created_date')
                    )
                    .orderBy('s1.created_date', 'desc')
                    .execute();
            } catch (error) {
                console.error("Error getting latest stocks: ", error);
            }
        }
        return latestStocks;
    }

    async getLatestStock(stock_id: string): Promise<Stock | undefined> {
        return await this.get(stock_id);
    }

    async getStockHistory(stock_id: string, interval: StockInterval): Promise<Stock[]> {
        // only 'now' is stored in the cache currently
        if (interval === 'now' && this.getFromCache(stock_id)) {
            console.log("History cache");
            // cache hit on 'now'
            return this.cache.get(stock_id);
        }
        
        let intervalOffset: Object;
        switch (interval) {
            case 'now':
                intervalOffset = { minutes: 60 }
                break;
            case 'hour':
                intervalOffset = { hours: 24 }
                break;
            case 'day':
                intervalOffset = { days: 30 }
                break;
            case 'month':
                intervalOffset = { months: 6 }
                break;                
        }
        
        const oldestStockDate: string = DateTime.now().minus(intervalOffset).toISO();
        
        const stockHistory: Stock[] = await this.db
            .selectFrom('stocks as s1')
            .innerJoin(
                eb => eb
                    .selectFrom('stocks')
                    .select([
                        'stock_id',
                        eb => eb.fn.max('created_date').as('max_created_date'),
                        eb => sql`extract(${sql.raw(interval === 'now' ? 'minute' : interval)} from ${eb.ref('created_date')})`.as('created_interval')
                    ])
                    .groupBy('created_interval')
                    .groupBy('stock_id')
                    .as('s2'),
                join => join.onRef('s1.stock_id', '=', 's2.stock_id').onRef('s1.created_date', '=', 's2.max_created_date')
            )
            .selectAll()
            .where('s1.stock_id', '=', stock_id as UsersUserId)
            .where('s1.created_date', '>=', oldestStockDate as StocksCreatedDate)
            .orderBy('s1.created_date', 'desc')
            .execute();

        return stockHistory;
    }
    
    constructor(db: Kysely<Database>) {
        super(db, 'stocks', 'stock_id');
    }
}

const stocks = new Stocks(db);
export { stocks as Stocks };
