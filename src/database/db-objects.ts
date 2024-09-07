import { UsersFactory } from "./datastores/Users";
import { Items } from "./datastores/Items";
import { Commands } from "./datastores/Commands";
import { Stocks } from "./datastores/Stocks";
import { db } from "./datastores/DataStore";

export const datastores = [UsersFactory, Items, Stocks, Commands];

export { UsersFactory, Items, Stocks, Commands, db };
