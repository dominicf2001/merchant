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

async function main() {
    try {
        if (shouldOverwrite) {
            await db.schema.dropTable("users").ifExists().cascade().execute();
            await db.schema.dropTable("items").ifExists().cascade().execute();
            await db.schema.dropTable("stocks").ifExists().cascade().execute();
        }

        // USERS
        await db.schema.createTable('users')
            .addColumn('id', 'varchar', col =>
                col.notNull().primaryKey())
            .addColumn('balance', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`balance >= 0`))
            .addColumn('activity_points', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`activity_points >= 0`))
            .addColumn('last_activity_date', 'timestamptz', col =>
                col.notNull().defaultTo(DateTime.now().toISO()))
            .addColumn('armor', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`armor >= 0`))
            .execute();

        // ITEMS 
        await db.schema.createTable('items')
            .addColumn('id', 'serial', col =>
                col.primaryKey())
            .addColumn('name', 'varchar', col =>
                col.notNull().unique())
            .addColumn('price', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`price >= 0`))
            .addColumn('icon', 'varchar')
            .execute();

        // STOCKS
        await db.schema.createTable('stocks')
            .addColumn('id', 'varchar', col =>
                col.notNull().unique())
            .addColumn('created_date', 'timestamptz', col =>
                col.notNull().defaultTo(DateTime.now().toISO()))
            .addColumn('total_shares_purchased', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`total_shares_purchased >= 0`))
            .addColumn('price', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`price >= 0`))
            .addPrimaryKeyConstraint('stock_pk', ['id', 'created_date'])
            .addForeignKeyConstraint('stock_fk', ['id'], 'users', ['id'])
            .execute();
 
        await processDatabase(config);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
