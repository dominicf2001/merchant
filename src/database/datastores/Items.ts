import { DataStore, db, BehaviorFunction } from './DataStore';
import { Items as Item, ItemsItemId } from '../schemas/public/Items';
import { Kysely } from 'kysely';
import { Collection, Message } from 'discord.js';
import Database from '../schemas/Database';
import path from 'path';
import fs from 'fs';

class Items extends DataStore<Item> {
    private behaviors: Collection<string, BehaviorFunction> = new Collection<string, BehaviorFunction>();
    
    // async refreshCache(): Promise<void> {
    //     const itemsPath = path.join(process.cwd(), 'built/items');
    //     const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
    //     for (const file of itemFiles) {
    //         const filePath = path.join(itemsPath, file);
    //         const itemObj = await import(filePath);
    //         if ('data' in itemObj && 'use' in itemObj) {
    //             this.behaviors.set(itemObj.data.item_id, itemObj.use);
    //             this.set(itemObj.data.item_id, new Deque<Item>([itemObj.data]));
    //         } else {
    //             console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
    //         }
    //     }
    // }

    async use(item_id: string, message: Message, args: string[]): Promise<void> {
        const use: BehaviorFunction = this.behaviors.get(item_id);
         await use(message, args);
    }

    constructor(db: Kysely<Database>) {
        super(db, 'items', 'item_id');
    }
}

const items = new Items(db);
export { items as Items };
