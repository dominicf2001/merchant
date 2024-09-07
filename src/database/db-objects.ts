import { UsersFactory } from "./datastores/Users";
import { ItemsFactory } from "./datastores/Items";
import { CommandsFactory } from "./datastores/Commands";
import { StocksFactory } from "./datastores/Stocks";
import { db } from "./datastores/DataStore";

export function getDatastores(guildId: string) {
    return {
        Users: UsersFactory.get(guildId),
        Stocks: StocksFactory.get(guildId),
        Items: ItemsFactory.get(guildId),
        Commands: CommandsFactory.get(guildId),
    };
}

export { UsersFactory, ItemsFactory, StocksFactory, CommandsFactory, db };
