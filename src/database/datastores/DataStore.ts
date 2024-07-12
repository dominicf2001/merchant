import { Kysely, PostgresDialect, Updateable, Insertable } from "kysely";
import Database from "../schemas/Database";
import { Collection } from "discord.js";
import { Pool, types } from "pg";
import { Message } from "discord.js";
import { DB_HOST, DB_NAME, DB_PORT, DB_USER } from "../../utilities";

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
    // log: ["query", "error"],
});

export type TableName = keyof Database;

export const getTableNames = async (db: Kysely<Database>) => (await db.introspection.getTables()).map(table => table.name as TableName);

export type TableID =
    | "user_id"
    | "item_id"
    | "stock_id"
    | "command_id"
export type BehaviorFunction = (
    message: Message,
    args: string[],
) => Promise<void>;

export async function dbWipe(db: Kysely<Database>, datastores: DataStore<any, any>[]) {
    try {
        for (const dataStore of datastores) {
            dataStore.clearCache();
        }

        const tableNames = await getTableNames(db);
        for (const table of tableNames) {
            await db.deleteFrom(table as any).execute();
            console.log(`All data wiped from table: ${table}`);
        }

        console.log('All data wiped successfully from all tables.');
    } catch (error) {
        console.error('An error occurred while wiping the database:', error);
    }
}

export abstract class DataStore<K, Data> {
    constructor(db: Kysely<Database>, tableName: TableName, tableID: TableID) {
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
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

            this.setInCache(id, result);
        } catch (error) {
            console.error(error);
            throw error;
        }
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

    async getFromDB(id: K): Promise<Data | undefined> {
        return (await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, "=", id as any)
            .executeTakeFirst()) as Data;
    }

    async getAll(): Promise<Data[]> {
        if (this.cache.size) {
            // cache hit
            const allData: Data[] = [];
            for (const id of this.cache.keys()) {
                const data = this.getFromCache(id);
                if (data) {
                    allData.push(data);
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

    async delete(id: K): Promise<void> {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName as any)
            .where(this.tableID, "=", id as any)
            .execute();
    }

    abstract refreshCache(...args: any): Promise<void>;
    abstract getFromCache(id: K): Data | undefined;
    abstract setInCache(id: K, data: Partial<Data>): void;
    clearCache() {
        this.cache.clear();
    };

    protected abstract cache: Collection<K, NonNullable<any>>;
    protected db: Kysely<Database>;
    protected tableName: TableName;
    protected tableID: TableID;
}

