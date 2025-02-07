import { Kysely, PostgresDialect, Updateable, Insertable } from "kysely";
import Database from "../schemas/Database";
import {
    CacheType,
    ChatInputCommandInteraction,
    Collection,
    GuildMember,
} from "discord.js";
import { Pool, types } from "pg";
import { Message } from "discord.js";
import { client, DB_HOST, DB_NAME, DB_PORT, DB_USER } from "../../utilities";
import { DateTime } from "luxon";
import { CommandOptions, CommandResponse } from "src/utilities";

let getDatastores: typeof import("../db-objects").getDatastores;

types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) =>
    v === null ? null : DateTime.fromSQL(v).toUTC().toSQL(),
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
    //log(event) {
    //    if (event.level === 'query') {
    //        console.log(event.query.sql)
    //        console.log(event.query.parameters)
    //    }
    //}
    // log: ["query", "error"],
});

export type TableName = keyof Database;

export const getTableNames = async (db: Kysely<Database>) =>
    (await db.introspection.getTables())
        .filter((table) => !table.isView)
        .map((table) => table.name as TableName);

export type TableID =
    | "user_id"
    | "item_id"
    | "stock_id"
    | "command_id"
    | "guild_id";
export type BehaviorFunction = (
    member: GuildMember,
    options: CommandOptions,
) => Promise<CommandResponse>;

export async function dbWipe(db: Kysely<Database>) {
    const module = await import("../db-objects");
    getDatastores = module.getDatastores;

    try {
        const guilds = client.guilds.cache;
        for (const guild of guilds.values()) {
            const datastores = Object.values(getDatastores(guild.id));
            for (const ds of datastores) {
                ds.clearCache();
            }
        }

        const tableNames = await getTableNames(db);
        for (const table of tableNames) {
            await db.deleteFrom(table as any).execute();
            console.log(`All data wiped from table: ${table}`);
        }

        console.log("All data wiped successfully from all tables.");
    } catch (error) {
        console.error("An error occurred while wiping the database:", error);
    }
}

export abstract class DataStore<K, Data> {
    constructor(
        db: Kysely<Database>,
        tableName: TableName,
        tableID: TableID,
        guildID: string,
    ) {
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
        this.guildID = guildID;
    }

    async set(
        id: K,
        data: Insertable<Data> | Updateable<Data> = {},
    ): Promise<void | boolean> {
        const newData: Data = {
            [this.tableID]: id as any,
            guild_id: this.guildID,
            ...data,
        } as Data;

        try {
            const result = (await this.db
                .insertInto(this.tableName)
                .values(newData)
                .onConflict((oc) =>
                    oc.columns([this.tableID, "guild_id"]).doUpdateSet(newData),
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
            .where("guild_id", "=", this.guildID as any)
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
                .where("guild_id", "=", this.guildID as any)
                .selectAll()
                .execute()) as Data[];
        }
    }

    async delete(id: K): Promise<void> {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName as any)
            .where(this.tableID, "=", id as any)
            .where("guild_id", "=", this.guildID as any)
            .execute();
    }

    exists(id: K): boolean {
        return Array.from(this.cache.keys()).includes(id);
    }

    abstract refreshCache(...args: any): Promise<void>;
    abstract getFromCache(id: K): Data | undefined;
    abstract setInCache(id: K, data: Partial<Data>): void;
    clearCache() {
        this.cache.clear();
    }

    protected abstract cache: Collection<K, NonNullable<any>>;
    protected db: Kysely<Database>;
    protected tableName: TableName;
    protected tableID: TableID;
    protected guildID: string;
    isTesting: boolean;
}

export abstract class DataStoreFactory<DS> {
    constructor(db: Kysely<Database>) {
        this.db = db;
    }

    get(guildID: string): DS {
        if (!this.guildDataStores.has(guildID)) {
            this.guildDataStores.set(guildID, this.construct(guildID));
        }
        return this.guildDataStores.get(guildID);
    }

    protected abstract construct(guildID: string): DS;

    protected guildDataStores = new Collection<string, DS>();
    protected db: Kysely<Database>;
}
