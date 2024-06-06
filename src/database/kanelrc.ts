import { Config } from "kanel";
import { makeKyselyHook } from "kanel-kysely";
import { DB_HOST, DB_NAME, DB_PORT, DB_USER } from "../utilities";

const config: Config = {
    connection: {
        database: DB_NAME,
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
    },
    preDeleteOutputFolder: true,
    outputPath: "./src/database/schemas",
    customTypeMap: {
        "pg_catalog.timestamptz": "string",
    },
    preRenderHooks: [makeKyselyHook()],
};

export default config;
