import { DataStore, db, BehaviorFunction, DataStoreFactory } from "./DataStore";
import { Items as Item } from "../schemas/public/Items";
import { Kysely } from "kysely";
import { Collection, GuildMember } from "discord.js";
import Database from "../schemas/Database";
import path from "path";
import fs from "fs";
import { CommandOptions } from "src/command-utilities";

class Items extends DataStore<string, Item> {
    constructor(db: Kysely<Database>, guildID: string) {
        super(db, "items", "item_id", guildID);
    }

    async use(
        item_id: string,
        member: GuildMember,
        options: CommandOptions,
    ): Promise<void> {
        const use: BehaviorFunction = this.behaviors.get(item_id);
        await use(member, options);
    }

    getFromCache(id: string): Item | undefined {
        return this.cache.get(id);
    }

    setInCache(id: string, item: Item): void {
        this.cache.set(id, item);
    }

    async refreshCache(): Promise<void> {
        const itemsPath = path.join(process.cwd(), "src/items");
        const itemFiles = fs
            .readdirSync(itemsPath)
            .filter((file) => file.endsWith(".ts"));
        for (const file of itemFiles) {
            const filePath = path.join(itemsPath, file);
            const itemObj = (await import(filePath)).default;
            if (itemObj && "data" in itemObj && "use" in itemObj) {
                this.behaviors.set(itemObj.data.item_id, itemObj.use);
                // TODO: custom query that on conflict does nothing
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

class ItemsFactory extends DataStoreFactory<Items> {
    protected construct(guildID: string): Items {
        return new Items(db, guildID);
    }
}

const itemsFactory = new ItemsFactory(db);
export { itemsFactory as ItemsFactory };
