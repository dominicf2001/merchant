import { Users } from "./datastores/Users";
import { Items } from "./datastores/Items";
import { Commands } from "./datastores/Commands";
import { Stocks } from "./datastores/Stocks";
import { db } from "./datastores/DataStore";

export const datastores = [Users, Items, Stocks, Commands];

export { Users, Items, Stocks, Commands, db };
