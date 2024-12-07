import { DataStore, db, BehaviorFunction, DataStoreFactory } from "./DataStore";
import { Kysely } from "kysely";
import { Commands as Command } from "../schemas/public/Commands";
import { Collection, GuildMember } from "discord.js";
import Database from "../schemas/Database";
import { CommandOptions, CommandResponse } from "src/utilities";

import buy from "src/commands/economy/buy";
import bal from "src/commands/economy/bal";
import give from "src/commands/economy/give";
import inv from "src/commands/economy/inv";
import rob from "src/commands/economy/rob";
import sell from "src/commands/economy/sell";
import shop from "src/commands/economy/shop";
import use from "src/commands/economy/use";
import work from "src/commands/economy/work";
import setbal from "src/commands/admin/setbal";
import help from "src/commands/misc/help";
import createstock from "src/commands/stocks/createstock";
import pf from "src/commands/stocks/pf";
import setprice from "src/commands/stocks/setprice";
import stock from "src/commands/stocks/stock";
import top from "src/commands/economy/top";

export const COMMANDS = [ buy, bal, give, inv, rob, sell, shop, top, use, work, setbal, help, createstock, pf, setprice, stock ]

class Commands extends DataStore<string, Command> {
    constructor(db: Kysely<Database>, guildID: string) {
        super(db, "commands", "command_id", guildID);
    }

    async execute(command_id: string, member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const execute: BehaviorFunction = this.behaviors.get(command_id);
        return await execute(member, options);
    }

    setInCache(id: string, command: Command): void {
        this.cache.set(id, command);
    }

    getFromCache(id: string): Command | undefined {
        return this.cache.get(id);
    }

    async refreshCache(): Promise<void> {
        for (const commandObj of COMMANDS) {
            this.behaviors.set(commandObj.data.command_id, commandObj.execute);
            // TODO: custom query that on conflict does nothing
            await this.set(commandObj.data.command_id, commandObj.data);
        }
    }

    private behaviors = new Collection<string, BehaviorFunction>();
    protected cache = new Collection<string, Command>();
}

class CommandsFactory extends DataStoreFactory<Commands> {
    protected construct(guildID: string): Commands {
        return new Commands(db, guildID);
    }
}

export interface CommandObj { 
    data: Partial<Command>, 
    execute: BehaviorFunction
}

const commandsFactory = new CommandsFactory(db);
export { commandsFactory as CommandsFactory };
