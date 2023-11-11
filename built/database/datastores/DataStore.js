"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataStore = exports.db = void 0;
const kysely_1 = require("kysely");
const discord_js_1 = require("discord.js");
const pg_1 = require("pg");
pg_1.types.setTypeParser(pg_1.types.builtins.TIMESTAMPTZ, (v) => v === null ? null : new Date(v).toISOString());
const dialect = new kysely_1.PostgresDialect({
    pool: new pg_1.Pool({
        database: 'merchant',
        host: 'localhost',
        user: 'dominic',
        port: 5432,
        max: 10
    })
});
exports.db = new kysely_1.Kysely({
    dialect,
    // log: ['query', 'error']
});
class DataStore {
    cache = new discord_js_1.Collection();
    db;
    tableName;
    tableID;
    async refreshCache() {
        const results = await exports.db.selectFrom(this.tableName).selectAll().execute();
        results.forEach(result => {
            this.cache.set(result[this.tableID], [result]);
        });
    }
    async delete(id) {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName)
            .where(this.tableID, '=', id)
            .execute();
    }
    getFromCache(id) {
        return this.cache.get(id)?.[0];
    }
    async getFromDB(id) {
        return await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, '=', id)
            .executeTakeFirst();
    }
    async get(id) {
        if (this.cache.has(id)) {
            // cache hit
            return this.getFromCache(id);
        }
        else {
            // cache miss
            return await this.getFromDB(id);
        }
    }
    async getAll() {
        if (this.cache.size) {
            // cache hit
            const allData = [];
            for (const id of this.cache.keys()) {
                const stockCache = this.cache.get(id);
                if (stockCache[0]) {
                    allData.push(stockCache[0]);
                }
            }
            return allData;
        }
        else {
            // cache miss
            return await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .execute();
        }
    }
    async set(id, data = {}) {
        const newData = { [this.tableID]: id, ...data };
        try {
            let result = await this.db
                .selectFrom(this.tableName)
                .selectAll()
                .where(this.tableID, '=', id)
                .executeTakeFirst();
            if (result) {
                result = await this.db
                    .updateTable(this.tableName)
                    .set(newData)
                    .where(this.tableID, '=', id)
                    .returningAll()
                    .executeTakeFirstOrThrow();
            }
            else {
                result = await this.db
                    .insertInto(this.tableName)
                    .values(newData)
                    .returningAll()
                    .executeTakeFirstOrThrow();
            }
            this.cache.set(id, [result]);
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
    constructor(db, tableName, tableID) {
        this.cache = new discord_js_1.Collection();
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
        this.refreshCache();
    }
}
exports.DataStore = DataStore;
