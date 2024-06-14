import { Kysely, PostgresDialect, Updateable, Insertable } from "kysely";
import Database from "../schemas/Database";
import { Collection } from "discord.js";
import { Pool, types } from "pg";
import { Message } from "discord.js";
import { DB_HOST, DB_NAME, DB_PORT, DB_USER } from "../../utilities.js";

types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) =>
    v === null ? null : new Date(v).toISOString(),
);

const dialect = new PostgresDialect({
    pool: new Pool({
        database: DB_NAME,
        host: DB_HOST,
        user: DB_USER,
        port: DB_PORT,
        max: 10,
    }),
});

export const db = new Kysely<Database>({
    dialect,
    log: ["query", "error"],
});

export type TableName = keyof Database;
export type TableID =
    | "user_id"
    | "item_id"
    | "stock_id"
    | "command_id"
    | "run_id";
export type BehaviorFunction = (
    message: Message,
    args: string[],
) => Promise<void>;

export abstract class DataStore<Data, K = string> {
    protected cache: Collection<K, Data[]> = new Collection<K, Data[]>();
    protected db: Kysely<Database>;
    protected tableName: TableName;
    protected tableID: TableID;

    async refreshCache(): Promise<void> {
        const results: Data[] = (await db
            .selectFrom(this.tableName)
            .selectAll()
            .execute()) as Data[];

        results.forEach((result) => {
            this.cache.set(result[this.tableID], [result]);
        });
    }

    async delete(id: K): Promise<void> {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName as any)
            .where(this.tableID, "=", id as any)
            .execute();
    }

    getFromCache(id: K): Data | undefined {
        return this.cache.get(id)?.[0];
    }

    async getFromDB(id: K): Promise<Data | undefined> {
        return (await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, "=", id as any)
            .executeTakeFirst()) as Data;
    }

    async get(id: K): Promise<Data | undefined> {
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
            return (await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .execute()) as Data[];
        }
    }

    async set(
        id: K,
        data: Insertable<Data> | Updateable<Data> = {},
    ): Promise<void> {
        const newData: Data = { [this.tableID]: id as any, ...data } as Data;

        try {
            const result = (await this.db
                .insertInto(this.tableName)
                .values(newData)
                .onConflict((oc) =>
                    oc.column(this.tableID).doUpdateSet(newData),
                )
                .returningAll()
                .executeTakeFirstOrThrow()) as Data;

            this.cache.set(id, [result]);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    constructor(db: Kysely<Database>, tableName: TableName, tableID: TableID) {
        this.cache = new Collection<K, Data[]>();
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
        this.refreshCache();
    }
}
