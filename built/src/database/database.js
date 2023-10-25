"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
var pg_1 = require("pg");
var kysely_1 = require("kysely");
var dialect = new kysely_1.PostgresDialect({
    pool: new pg_1.Pool({
        database: 'test',
        host: 'localhost',
        user: 'admin',
        port: 5434,
        max: 10,
    })
});
// Database interface is passed to Kysely's constructor, and from now on, Kysely 
// knows your database structure.
// Dialect is passed to Kysely's constructor, and from now on, Kysely knows how 
// to communicate with your database.
exports.db = new kysely_1.Kysely({
    dialect: dialect,
});
