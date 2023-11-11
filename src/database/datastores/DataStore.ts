import { Kysely, PostgresDialect, Updateable, Insertable } from 'kysely';
import Database from '../schemas/Database';
import { Collection } from 'discord.js';
import { Pool, types } from 'pg';
import { Message } from 'discord.js';

types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => v === null ? null : new Date(v).toISOString());

const dialect = new PostgresDialect({
    pool: new Pool({
        database: 'merchant',
        host: 'localhost',
        user: 'dominic',
        port: 5432,
        max: 10
    })
});

export const db = new Kysely<Database>({
    dialect,
    // log: ['query', 'error']
});

export type TableName = keyof Database;
export type TableID = 'user_id' | 'item_id' | 'stock_id' | 'command_id';
export type BehaviorFunction = (message: Message, args: string[]) => Promise<void>;

export abstract class DataStore<Data> {
    protected cache: Collection<string, Data[]> = new Collection<string, Data[]>();
    protected db: Kysely<Database>;
    protected tableName: TableName;
    protected tableID: TableID;

    async refreshCache(): Promise<void> {
        const results: Data[] = await db.selectFrom(this.tableName).selectAll().execute() as Data[];

        results.forEach(result => {
            this.cache.set(result[this.tableID], [result]);
        });
    }

    async delete(id: string): Promise<void> {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName as any)
            .where(this.tableID, '=', id as any)
            .execute();
    }

    getFromCache(id: string) : Data | undefined {
        return this.cache.get(id)?.[0];        
    }

    async getFromDB(id: string): Promise<Data | undefined> {
        return await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, '=', id as any)
            .executeTakeFirst() as Data;
    }

    async get(id: string): Promise<Data | undefined> {
        if (this.cache.has(id)) {
            // cache hit
            return this.getFromCache(id);
        } else {
            // cache miss
            return await this.getFromDB(id);            
        }
    }

    async getAll(): Promise<Data[]> {
        if (this.cache.size) {
            // cache hit
            const allData: Data[] = [];
            for (const id of this.cache.keys()) {
                const stockCache = this.cache.get(id);
                if (stockCache[0]) {
                    allData.push(stockCache[0]);   
                }
            }
            return allData;
        } else {
            // cache miss
            return await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .execute() as Data[];
        }
    }

    async set(id: string, data: Insertable<Data> | Updateable<Data> = {}): Promise<void> {
        const newData: Data = { [this.tableID]: id as any, ...data } as Data;

        try {
            let result: Data = await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .where(this.tableID, '=', id as any)
                .executeTakeFirst() as Data;

            if (result) {
                result = await this.db
                    .updateTable(this.tableName)
                    .set(newData)
                    .where(this.tableID, '=', id as any)
                    .returningAll()
                    .executeTakeFirstOrThrow() as Data;
            } else {
                result = await this.db
                    .insertInto(this.tableName)
                    .values(newData)
                    .returningAll()
                    .executeTakeFirstOrThrow() as Data;
            }

            this.cache.set(id, [result]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }


    constructor(db: Kysely<Database>, tableName: TableName, tableID: TableID) {
        this.cache = new Collection<TableID, Data[]>();
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
        this.refreshCache();
    }
}
