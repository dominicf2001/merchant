import { DataStore, db, BehaviorFunction } from "./DataStore";
import { Items as Item } from "../schemas/public/Items";
import { Kysely } from "kysely";
import { Collection, Message } from "discord.js";
import Database from "../schemas/Database";
import path from "path";
import fs from "fs";

class Items extends DataStore<string, Item> {
    constructor(db: Kysely<Database>) {
        super(db, "items", "item_id");
        this.refreshCache();
    }

    async use(
        item_id: string,
        message: Message,
        args: string[],
    ): Promise<void> {
        const use: BehaviorFunction = this.behaviors.get(item_id);
        await use(message, args);
    }

    getFromCache(id: string): Item | undefined {
        return this.cache.get(id);
    }

    setInCache(id: string, item: Item): void {
        this.cache.set(id, item);
    }

    async refreshCache(): Promise<void> {
        const itemsPath = path.join(process.cwd(), "built/items");
        const itemFiles = fs
            .readdirSync(itemsPath)
            .filter((file) => file.endsWith(".js"));
        for (const file of itemFiles) {
            const filePath = path.join(itemsPath, file);
            const itemObj = (await import(filePath)).default;
            if ("data" in itemObj && "use" in itemObj) {
                this.behaviors.set(itemObj.data.item_id, itemObj.use);
                await this.set(itemObj.data.item_id, itemObj.data);
            } else {
                // console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
            }
        }
    }

    private behaviors: Collection<string, BehaviorFunction> = new Collection<
        string,
        BehaviorFunction
    >();
    protected cache = new Collection<string, Item>;
}

const items = new Items(db);
export { items as Items };
