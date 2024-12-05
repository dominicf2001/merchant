import { DataStore, db, BehaviorFunction, DataStoreFactory } from "./DataStore";
import { Kysely } from "kysely";
import { Commands as Command } from "../schemas/public/Commands";
import { CacheType, ChatInputCommandInteraction, Collection, GuildMember, Message } from "discord.js";
import Database from "../schemas/Database";
import { CommandOptions, CommandResponse, loadCommands } from "src/command-utilities";

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
        const commands = await loadCommands();
        for (const commandObj of commands) {
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

const commandsFactory = new CommandsFactory(db);
export { commandsFactory as CommandsFactory };
