"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const kanel_kysely_1 = require("kanel-kysely");
const config = {
    connection: {
        host: 'localhost',
        user: 'dominic',
        password: '9257',
        database: 'merchant',
    },
    preDeleteOutputFolder: true,
    outputPath: './src/database/schemas',
    customTypeMap: {
        'pg_catalog.timestamptz': 'string'
    },
    preRenderHooks: [(0, kanel_kysely_1.makeKyselyHook)()]
};
exports.default = config;
