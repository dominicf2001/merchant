import { DateTime } from 'luxon';
import { Pool } from 'pg';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { processDatabase } from 'kanel';
import config from './kanelrc.js';

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
            await db.schema.dropTable("user_items").ifExists().cascade().execute();
            await db.schema.dropTable("user_stocks").ifExists().cascade().execute();
            await db.schema.dropTable("user_cooldowns").ifExists().cascade().execute();
        }

        // USERS
        await db.schema.createTable('users')
            .addColumn('user_id', 'varchar(30)', col =>
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
            .addColumn('item_id', 'varchar(30)', col =>
                col.notNull().primaryKey())
            .addColumn('price', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`price >= 0`))
            .addColumn('icon', 'varchar(30)')
            .execute();
        
        // STOCKS
        await db.schema.createTable('stocks')
            .addColumn('stock_id', 'varchar(30)', col =>
                col.notNull())
            .addColumn('created_date', 'timestamptz', col =>
                col.notNull().defaultTo(DateTime.now().toISO()))
            .addColumn('price', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`price >= 0`))
            .addForeignKeyConstraint('stock_fk_user', ['stock_id'], 'users', ['user_id'], (cb) => cb.onDelete('cascade'))
            .addPrimaryKeyConstraint('stock_pk', ['stock_id', 'created_date'])
            .execute();

        await db.schema
            .createIndex('stock_history')
            .on('stocks')
            .columns(['stock_id'])
            .execute();

        // USER ITEMS
        await db.schema.createTable('user_items')
            .addColumn('user_id', 'varchar(30)', col =>
                col.notNull())
            .addColumn('item_id', 'varchar(30)', col =>
                col.notNull())
            .addColumn('quantity', 'integer', col =>
                col.notNull().defaultTo(1).check(sql`quantity > 0`))
            .addPrimaryKeyConstraint('user_items_pk', ['user_id', 'item_id'])
            .addForeignKeyConstraint('user_items_fk_user', ['user_id'], 'users', ['user_id'], (cb) => cb.onDelete('cascade'))
            .addForeignKeyConstraint('user_items_fk_item', ['item_id'], 'items', ['item_id'], (cb) => cb.onDelete('cascade'))
            .execute();

        // USER STOCKS
        await db.schema.createTable('user_stocks')
            .addColumn('user_id', 'varchar(30)', col =>
                col.notNull())
            .addColumn('stock_id', 'varchar(30)', col =>
                col.notNull())
            .addColumn('purchase_date', 'timestamptz', col =>
                col.notNull().defaultTo(DateTime.now().toISO()))
            .addColumn('quantity', 'integer', col =>
                col.notNull().defaultTo(1).check(sql`quantity > 0`))
            .addColumn('purchase_price', 'integer', col =>
                col.notNull().defaultTo(0).check(sql`purchase_price >= 0`))
            .addPrimaryKeyConstraint('user_stocks_pk', ['user_id', 'stock_id', 'purchase_date'])
            .addForeignKeyConstraint('user_stocks_fk_user', ['user_id'], 'users', ['user_id'], (cb) => cb.onDelete('cascade'))
            .addForeignKeyConstraint('user_stocks_fk_stock', ['stock_id'], 'users', ['user_id'], (cb) => cb.onDelete('cascade'))
            .execute();
        
        // USER COOLDOWNS
        await db.schema.createTable('user_cooldowns')
            .addColumn('user_id', 'varchar(30)', col =>
                col.notNull())
            .addColumn('command_name', 'varchar(30)', col =>
                col.notNull())
            .addColumn('start_date', 'timestamptz', col =>
                col.notNull().defaultTo(DateTime.now().toISO()))
            .addPrimaryKeyConstraint('user_cooldown_pk', ['user_id', 'command_name'])
            .addForeignKeyConstraint('user_cooldown_fk_user', ['user_id'], 'users', ['user_id'], (cb) => cb.onDelete('cascade'))
            .execute();
 
        await processDatabase(config);
    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
