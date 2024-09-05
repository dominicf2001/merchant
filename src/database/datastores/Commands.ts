import { DataStore, db, BehaviorFunction } from "./DataStore";
import { Kysely } from "kysely";
import { Commands as Command } from "../schemas/public/Commands";
import { Collection, Message } from "discord.js";
import Database from "../schemas/Database";
import path from "path";
import fs from "fs";

class Commands extends DataStore<string, Command> {
    constructor(db: Kysely<Database>) {
        super(db, "commands", "command_id");
    }

    async execute(
        command_id: string,
        message: Message,
        args: string[],
    ): Promise<void> {
        const execute: BehaviorFunction = this.behaviors.get(command_id);
        await execute(message, args);
    }

    setInCache(id: string, command: Command): void {
        this.cache.set(id, command);
    }

    getFromCache(id: string): Command | undefined {
        return this.cache.get(id);
    }

    async refreshCache(): Promise<void> {
        const foldersPath: string = path.join(process.cwd(), "src/commands");
        const commandFolders: string[] = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath: string = path.join(foldersPath, folder);
            const commandFiles: string[] = fs
                .readdirSync(commandsPath)
                .filter((file) => file.endsWith(".ts"));
            for (const file of commandFiles) {
                const filePath: string = path.join(commandsPath, file);
                const commandObj = (await import(filePath)).default;
                if (commandObj && "data" in commandObj && "execute" in commandObj) {
                    this.behaviors.set(
                        commandObj.data.command_id,
                        commandObj.execute,
                    );
                    await this.set(commandObj.data.command_id, commandObj.data);
                } else {
                    // console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }

    private behaviors = new Collection<
        string,
        BehaviorFunction
    >();
    protected cache = new Collection<string, Command>;
}

const commands = new Commands(db);
export { commands as Commands };
