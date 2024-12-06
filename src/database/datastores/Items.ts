import { DataStore, db, BehaviorFunction, DataStoreFactory } from "./DataStore";
import { Items as Item } from "../schemas/public/Items";
import { Kysely } from "kysely";
import { Collection, GuildMember } from "discord.js";
import Database from "../schemas/Database";
import { CommandOptions, loadObjectsFromFolder } from "src/utilities";

class Items extends DataStore<string, Item> {
    constructor(db: Kysely<Database>, guildID: string) {
        super(db, "items", "item_id", guildID);
    }

    async use(item_id: string, member: GuildMember, options: CommandOptions): Promise<void> {
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
        const items = await loadObjectsFromFolder<{ data: any, use: any }>("src/items", { data: true, use: true });
        for (const item of items) {
            this.behaviors.set(item.data.command_id, item.use);
            // TODO: custom query that on conflict does nothing
            await this.set(item.data.command_id, item.data);
        }
    }

    private behaviors: Collection<string, BehaviorFunction> = new Collection<string, BehaviorFunction>();
    protected cache = new Collection<string, Item>;
}

class ItemsFactory extends DataStoreFactory<Items> {
    protected construct(guildID: string): Items {
        return new Items(db, guildID);
    }
}

const itemsFactory = new ItemsFactory(db);
export { itemsFactory as ItemsFactory };
