import { DateTime } from 'luxon';
import { Pool } from 'pg';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { processDatabase } from 'kanel';
import config from './kanelrc';

const dialect = new PostgresDialect({
    pool: new Pool({
        database: 'merchant',
        host: 'localhost',
        user: 'dominic',
        port: 5432,
        max: 10,
    }),
});

const db = new Kysely({
    dialect,
});

const args: string[] = process.argv.slice(2);
const shouldOverwrite: boolean = (args[0] === "-f");

console.log(shouldOverwrite);

async function main() {
    try {
        if (shouldOverwrite) {
            await db.schema.dropTable("users").ifExists().execute();
        }
        
        await db.schema.createTable('users')
            .addColumn('id', 'varchar', col =>
                col.notNull().primaryKey())
            .addColumn('balance', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`balance >= 0`))
            .addColumn('activity_points', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`activity_points >= 0`))
            .addColumn('last_active_date', 'timestamptz', col =>
                col.notNull().defaultTo(DateTime.now().toISO()))
            .addColumn('armor', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`armor >= 0`))
            .addColumn('role', 'integer')
            .execute();
 
        await processDatabase(config);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
