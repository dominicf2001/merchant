import path from 'path';
import { Config, TypeDefinition } from 'kanel'

const config: Config = {
    connection: {
        host: 'localhost',
        user: 'dominic',
        password: '9257',
        database: 'merchant',
    },
    preDeleteOutputFolder: true,
    outputPath: './schemas',
    customTypeMap: {
        'pg_catalog.timestamptz': {
            name: 'DateTime',
            typeImports: [
                {
                    name: 'DateTime',
                    path: 'luxon',
                    isAbsolute: true,
                    isDefault: false,
                    importAsType: false
                },
            ],
        }
    }
};

export default config;
