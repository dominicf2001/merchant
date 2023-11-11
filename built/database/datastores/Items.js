"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Items = void 0;
const DataStore_1 = require("./DataStore");
const discord_js_1 = require("discord.js");
class Items extends DataStore_1.DataStore {
    behaviors = new discord_js_1.Collection();
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
    async use(item_id, message, args) {
        const use = this.behaviors.get(item_id);
        await use(message, args);
    }
    constructor(db) {
        super(db, 'items', 'item_id');
    }
}
const items = new Items(DataStore_1.db);
exports.Items = items;
