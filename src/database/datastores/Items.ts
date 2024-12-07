import { DataStore, db, BehaviorFunction, DataStoreFactory } from "./DataStore";
import { Items as Item } from "../schemas/public/Items";
import { Kysely } from "kysely";
import { Collection, GuildMember } from "discord.js";
import Database from "../schemas/Database";
import { CommandOptions } from "src/utilities";

import armor from "src/items/armor";
import dye from "src/items/dye";
import megaphone from "src/items/megaphone";
import mute from "src/items/mute";
import nametag from "src/items/nametag";
import unmute from "src/items/unmute";

export const ITEMS = [ armor, dye, megaphone, mute, nametag, unmute ];

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
        for (const item of ITEMS) {
            this.behaviors.set(item.data.item_id, item.use);
            // TODO: custom query that on conflict does nothing
            await this.set(item.data.item_id, item.data);
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

export interface ItemObj { 
    data: Partial<Item>, 
    use: BehaviorFunction
}

const itemsFactory = new ItemsFactory(db);
export { itemsFactory as ItemsFactory };
