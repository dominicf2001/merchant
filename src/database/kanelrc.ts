import { Config } from "kanel";
import { makeKyselyHook } from "kanel-kysely";
import { types } from "pg";

const config: Config = {
    connection: {
        host: "localhost",
        user: "dominic",
        password: "9257",
        database: "merchant",
    },
    preDeleteOutputFolder: true,
    outputPath: "./src/database/schemas",
    customTypeMap: {
        "pg_catalog.timestamptz": "string",
    },
    preRenderHooks: [makeKyselyHook()],
};

export default config;
