import { Config } from "kanel";
import { makeKyselyHook } from "kanel-kysely";

const config: Config = {
    connection: {
        database: "merchant",
        host: "/run/user/1000/devenv-5c7814d/postgres",
        port: null,
        user: "dominicf",
    },
    preDeleteOutputFolder: true,
    outputPath: "./src/database/schemas",
    customTypeMap: {
        "pg_catalog.timestamptz": "string",
    },
    preRenderHooks: [makeKyselyHook()],
};

export default config;
