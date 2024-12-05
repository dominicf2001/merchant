import { Pool } from "pg";
import { Kysely, PostgresDialect, sql } from "kysely";
import { processDatabase } from "kanel";
import config from "./kanelrc";
import { DB_HOST, DB_NAME, DB_PORT, DB_USER } from "../utilities";
import Database from "./schemas/Database.js";
import { getTableNames } from "./datastores/DataStore";

const args: string[] = process.argv.slice(2);
const shouldOverwrite: boolean = args[0] === "-f";

const dialect = new PostgresDialect({
    pool: new Pool({
        database: DB_NAME,
        host: DB_HOST,
        user: DB_USER,
        port: DB_PORT,
        max: 10,
    }),
});

const db = new Kysely<Database>({
    dialect,
    log: ["query", "error"],
});

(async function main() {
    try {
        if (shouldOverwrite) {
            const tableNames = await getTableNames(db);
            for (const table of tableNames) {
                await db.schema.dropTable(table).ifExists().cascade().execute();
            }
        }

        // USERS
        await db.schema
            .createTable("users")
            .addColumn("user_id", "varchar(30)", (col) => col.notNull())
            .addColumn("username", "varchar(255)", (col) => col.notNull())
            .addPrimaryKeyConstraint("users_pk", ["user_id"])
            .execute();

        // USER STATS
        await db.schema
            .createTable("user_stats")
            .addColumn("user_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            .addColumn("balance", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`balance >= 0`),
            )
            .addColumn("armor", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`armor >= 0`),
            )
            .addPrimaryKeyConstraint("user_stats_pk", ["user_id", "guild_id"])
            .addForeignKeyConstraint(
                "user_stats_fk_user",
                ["user_id"],
                "users",
                ["user_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .execute();

        await db.schema.createView("users_full")
            .orReplace()
            .as(db
                .selectFrom("users")
                .innerJoin("user_stats", "users.user_id", "user_stats.user_id")
                .select([
                    "users.user_id",
                    "user_stats.guild_id",
                    "users.username",
                    "user_stats.armor",
                    "user_stats.balance"
                ])
            )
            .execute();

        // ITEMS
        await db.schema
            .createTable("items")
            .addColumn("item_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            .addColumn("price", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`price >= 0`),
            )
            .addColumn("description", "varchar", (col) =>
                col.notNull().defaultTo(""),
            )
            .addColumn("usage", "varchar", (col) => col.notNull().defaultTo(""))
            .addColumn("emoji_code", "varchar(30)", (col) =>
                col.notNull().defaultTo(":black_small_square:"),
            )
            .addPrimaryKeyConstraint("items_pk", ["item_id", "guild_id"])
            .execute();

        // STOCKS
        await db.schema
            .createTable("stocks")
            .addColumn("stock_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            .addColumn("created_date", "timestamptz", (col) =>
                col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
            )
            .addColumn("price", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`price >= 0`),
            )
            .addPrimaryKeyConstraint("stocks_pk", [
                "stock_id",
                "guild_id",
                "created_date",
            ])
            .addForeignKeyConstraint(
                "stocks_fk_user",
                ["stock_id"],
                "users",
                ["user_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .execute();

        await db.schema
            .createIndex("stock_history")
            .on("stocks")
            .columns(["stock_id", "guild_id"])
            .execute();

        // COMMANDS
        await db.schema
            .createTable("commands")
            .addColumn("command_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            // .addColumn("usage", "varchar", (col) => col.notNull().defaultTo(""))
            .addColumn("metadata", "json", (col) => col.notNull().defaultTo("{}"))
            .addColumn("cooldown_time", "integer", (col) =>
                col.notNull().defaultTo(0),
            )
            .addColumn("is_admin", "boolean", (col) =>
                col.notNull().defaultTo(false),
            )
            .addPrimaryKeyConstraint("commands_pk", ["command_id", "guild_id"])
            .execute();

        // USER ACTIVITY
        await db.schema
            .createTable("user_activities")
            .addColumn("user_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            .addColumn("activity_points_short", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`activity_points_short >= 0`),
            )
            .addColumn("activity_points_long", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`activity_points_long >= 0`),
            )
            .addColumn("activity_points_short_ema", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`activity_points_short_ema >= 0`),
            )
            .addColumn("activity_points_short_emsd", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`activity_points_short_emsd >= 0`),
            )
            .addColumn("activity_points_long_sma", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`activity_points_long_sma >= 0`),
            )
            .addColumn("last_activity_date", "timestamptz", (col) =>
                col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
            )
            .addColumn("first_activity_date", "timestamptz", (col) =>
                col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
            )
            .addPrimaryKeyConstraint("user_activities_pk", [
                "user_id",
                "guild_id"
            ])
            .addForeignKeyConstraint(
                "user_activities_fk_user",
                ["user_id"],
                "users",
                ["user_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .execute();

        // USER ITEMS
        await db.schema
            .createTable("user_items")
            .addColumn("user_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            .addColumn("item_id", "varchar(30)", (col) => col.notNull())
            .addColumn("quantity", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(1)
                    .check(sql`quantity > 0`),
            )
            .addPrimaryKeyConstraint("user_items_pk", ["user_id", "guild_id", "item_id"])
            .addForeignKeyConstraint(
                "user_items_fk_user",
                ["user_id"],
                "users",
                ["user_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .addForeignKeyConstraint(
                "user_items_fk_item",
                ["item_id", "guild_id"],
                "items",
                ["item_id", "guild_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .execute();

        // USER STOCKS
        await db.schema
            .createTable("user_stocks")
            .addColumn("user_id", "varchar(30)", (col) => col.notNull())
            .addColumn("stock_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            .addColumn("purchase_date", "timestamptz", (col) =>
                col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
            )
            .addColumn("quantity", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(1)
                    .check(sql`quantity > 0`),
            )
            .addColumn("purchase_price", "integer", (col) =>
                col
                    .notNull()
                    .defaultTo(0)
                    .check(sql`purchase_price >= 0`),
            )
            .addPrimaryKeyConstraint("user_stocks_pk", [
                "user_id",
                "guild_id",
                "stock_id",
                "purchase_date",
            ])
            .addForeignKeyConstraint(
                "user_stocks_fk_user",
                ["user_id"],
                "users",
                ["user_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .addForeignKeyConstraint(
                "user_stocks_fk_stock",
                ["stock_id"],
                "users",
                ["user_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .execute();

        // USER COOLDOWNS
        await db.schema
            .createTable("user_cooldowns")
            .addColumn("user_id", "varchar(30)", (col) => col.notNull())
            .addColumn("guild_id", "varchar(30)", (col) => col.notNull())
            .addColumn("command_id", "varchar(30)", (col) => col.notNull())
            .addColumn("start_date", "timestamptz", (col) =>
                col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`),
            )
            .addPrimaryKeyConstraint("user_cooldowns_pk", [
                "user_id",
                "guild_id",
                "command_id",
            ])
            .addForeignKeyConstraint(
                "user_cooldowns_fk_user",
                ["user_id"],
                "users",
                ["user_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .addForeignKeyConstraint(
                "user_cooldowns_fk_command",
                ["command_id", "guild_id"],
                "commands",
                ["command_id", "guild_id"],
                (cb) => cb.onDelete("cascade"),
            )
            .execute();

        await processDatabase(config);
    } catch (error) {
        console.error("An error occurred:", error);
    }
})();
