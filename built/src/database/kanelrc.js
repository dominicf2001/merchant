"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @type {import('kanel').Config} */
var config = {
    connection: {
        host: 'localhost',
        user: 'postgres',
        password: 'postgres',
        database: 'acme',
    },
    preDeleteOutputFolder: true,
    outputPath: './src/schemas',
    customTypeMap: {
        'pg_catalog.tsvector': 'string',
        'pg_catalog.bpchar': 'string',
    },
};
exports.default = config;
