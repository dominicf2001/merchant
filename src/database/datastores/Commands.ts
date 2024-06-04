import { DataStore, db, BehaviorFunction } from './DataStore';
import { Kysely } from 'kysely';
import { Commands as Command } from '../schemas/public/Commands';
import { Collection, Message } from 'discord.js';
import Database from '../schemas/Database';
import path from 'path';
import fs from 'fs';

class Commands extends DataStore<Command> {
    private behaviors: Collection<string, BehaviorFunction> = new Collection<string, BehaviorFunction>();
    
    async refreshCache(): Promise<void> {
        const foldersPath: string = path.join(process.cwd(), 'built/commands');
        const commandFolders: string[] = fs.readdirSync(foldersPath);
        
        for (const folder of commandFolders) {
            const commandsPath: string = path.join(foldersPath, folder);
            const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath: string = path.join(commandsPath, file);
                const commandObj = (await import(filePath)).default;
                if ('data' in commandObj && 'execute' in commandObj) {
                    this.behaviors.set(commandObj.data.command_id, commandObj.execute);
                    await this.set(commandObj.data.command_id, commandObj.data);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }

    async execute(command_id: string, message: Message, args: string[]): Promise<void> {
        const execute: BehaviorFunction = this.behaviors.get(command_id);
        await execute(message, args);
    }

    constructor(db: Kysely<Database>) {
        super(db, 'commands', 'command_id');
    }
}

const commands = new Commands(db);
export { commands as Commands };
