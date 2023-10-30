import { Kysely, PostgresDialect, Updateable, Insertable, sql, Selectable } from 'kysely';
import { Users as User, NewUsers as NewUser, UsersUpdate as UserUpdate, UsersUserId } from './schemas/public/Users';
import { Items as Item, NewItems as NewItem, ItemsUpdate as ItemUpdate, ItemsItemId } from './schemas/public/Items';
import { Stocks as Stock, NewStocks as NewStock, StocksUpdate as StockUpdate } from './schemas/public/Stocks';
import { UserItems as UserItem, NewUserItems as NewUserItem, UserItemsUpdate as UserItemUpdate } from './schemas/public/UserItems';
import Database from './schemas/Database';

import { Collection } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { Pool } from 'pg';

const dialect = new PostgresDialect({
    pool: new Pool({
        database: 'merchant',
        host: 'localhost',
        user: 'dominic',
        port: 5432,
        max: 10,
    }),
});

const db = new Kysely<Database>({
    dialect,
});

type TableName = keyof Database;
type TableID = 'user_id' | 'item_id';

abstract class DataStore<Data> {
    protected cache: Collection<string, Data>;
    protected db: Kysely<Database>;
    protected tableName: TableName;
    protected tableID: TableID;

    async refreshCache(): Promise<void> {
        const results: Data[] = await db.selectFrom(this.tableName).selectAll().execute() as Data[];

        results.forEach(result => {
            this.cache.set(result[this.tableID], result);
        });
    }

    async destroyDB() {
        db.destroy();
    }

    async delete(id: string): Promise<void> {
        this.cache.delete(id);
        await this.db
            .deleteFrom(this.tableName as any)
            .where(this.tableID, '=', id as any)
            .execute();
    }

    async get(id: string): Promise<Data | undefined> {
        if (this.cache.has(id)) {
            // cache hit
            return this.cache.get(id);
        }

        // cache miss
        const result: Data = await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, '=', id as any)
            .executeTakeFirst() as Data;
        
        return result;
    }

    async set(id: string, data: Insertable<Data> | Updateable<Data> = {}): Promise<void> {
        let result: Data = await this.db
            .selectFrom(this.tableName)
            .selectAll()
            .where(this.tableID, '=', id as any)
            .executeTakeFirst() as Data;
        
        if (result) {
            await this.db
                .updateTable(this.tableName)
                .set({ [this.tableID]: id, ...data })
                .where(this.tableID, '=', id as any)
                .execute();
        } else {
            result = await this.db
                .insertInto(this.tableName)
                .values({ [this.tableID]: id, ...data })
                .returningAll()
                .executeTakeFirst() as Data;
        }

        this.cache.set(id, { ...result, ...data });
    }

    constructor(db: Kysely<Database>, tableName: TableName, tableID: TableID) {
        this.cache = new Collection<TableID, Data>();
        this.db = db;
        this.tableName = tableName;
        this.tableID = tableID;
    }
}

class Users extends DataStore<User> {
    async addBalance(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);
        
        let newBalance = user ? (user.balance + amount) : amount;
        if (newBalance < 0) newBalance = 0;

        await this.set(user_id, {
            user_id: user_id as UsersUserId,
            balance: newBalance
        });
    }

    async addArmor(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);

        let newArmor = user ? (user.armor + amount) : amount;
        if (newArmor < 0) newArmor = 0;

        await this.set(user_id, {
            user_id: user_id as UsersUserId,
            armor: newArmor
        });
    }

    async addActivityPoints(user_id: string, amount: number): Promise<void> {
        const user = await this.get(user_id);

        let newActivityPoints = user ? (user.activity_points + amount) : amount;
        if (newActivityPoints < 0) newActivityPoints = 0;

        await this.set(user_id, {
            user_id: user_id as UsersUserId,
            activity_points: newActivityPoints
        });
    }
    
    async addItem(user_id: string, item_id: string, amount: number): Promise<void> {
        const userItem = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as any)
            .where('item_id', '=', item_id as any)
            .executeTakeFirst();

        if (!userItem && amount > 0) {
            this.set(user_id);
            
            await this.db
                .insertInto('user_items')
                .values({
                    user_id: user_id as UsersUserId,
                    item_id: item_id as ItemsItemId,
                    quantity: amount
                })
                .execute();
            return;
        } else if (!userItem && amount <= 0) {
            return;
        }

        const newQuantity = userItem.quantity + amount;
        if (newQuantity <= 0) {
            await this.db
                .deleteFrom('user_items')
                .where('user_id', '=', user_id as any)
                .where('item_id', '=', item_id as any)
                .execute();
        } else {
            await this.db
                .updateTable('user_items')
                .set({
                    quantity: newQuantity
                })
                .where('user_id', '=', user_id as any)
                .where('item_id', '=', item_id as any)
                .execute();
        }
    }

    async setBalance(user_id: string, amount: number): Promise<void> {
        if (amount < 0) amount = 0;

        await this.set(user_id, {
            user_id: user_id as UsersUserId,
            balance: amount
        });
    }

    async setActivityPoints(user_id: string, amount: number): Promise<void> {
        if (amount < 0) amount = 0;

        await this.set(user_id, {
            user_id: user_id as UsersUserId,
            activity_points: amount
        });
    }

    async getBalance(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user.balance;
    }

    async getArmor(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user.armor;
    }

    async getActivityPoints(user_id: string): Promise<number> {
        const user = await this.get(user_id);
        return user.activity_points;
    }

    async getItem(user_id: string, item_id: string): Promise<UserItem | undefined> {
        const userItem: UserItem = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as any)
            .where('item_id', '=', item_id as any)
            .executeTakeFirst() as UserItem;
        
        return userItem;
    }

    async getItems(user_id: string): Promise<UserItem[]> {
        const userItems: UserItem[] = await this.db
            .selectFrom('user_items')
            .selectAll()
            .where('user_id', '=', user_id as any)
            .execute() as UserItem[];
        return userItems;
    }

    constructor(db: Kysely<Database>) {
        super(db, 'users', 'user_id');
    }
}

class Items extends DataStore<Item> {
    async refreshCache(): Promise<void> {
        // const itemsPath = path.join(process.cwd(), 'items');
        // const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
        // for (const file of itemFiles) {
        //     const filePath = path.join(itemsPath, file);
        //     const item: Item = await import(filePath);
        //     if ('data' in item && 'use' in item) {
        //         this.cache.set(item.data., item);
        //     } else {
        //         console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
        //     }
        // }
    }

    constructor(db: Kysely<Database> | null) {
        super(db, 'items', 'item_id');
    }
}

// class Stocks extends DataStore<Stock> {

// }

// class Commands extends DataStore<Command> {
//     async refreshCache(): Promise<void> {
//         const foldersPath: string = path.join(process.cwd(), 'commands');
//         const commandFolders: string[] = fs.readdirSync(foldersPath);

//         for (const folder of commandFolders) {
//             const commandsPath: string = path.join(foldersPath, folder);
//             const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
//             for (const file of commandFiles) {
//                 const filePath: string = path.join(commandsPath, file);
//                 const command: Command = await import(filePath);
//                 if ('data' in command && 'execute' in command) {
//                     this.cache.set(command.data.name, command);
//                 } else {
//                     console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
//                 }
//             }
//         }
//     }
// }

const users = new Users(db);
const items = new Items(db);

export { users as Users, items as Items};

