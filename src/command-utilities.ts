import fs from "fs";
import path from "path";

export const makeChoices = (...choices: string[]) => {
  return choices.map(choice => ({ name: choice, value: choice }))
}

export type CommandObj = { data: any; execute: any };
export const loadCommands = async (): Promise<CommandObj[]> => {
    const foldersPath: string = path.join(process.cwd(), "src/commands");
    const commandFolders: string[] = fs.readdirSync(foldersPath);

    const commands = [];
    for (const folder of commandFolders) {
        const commandsPath: string = path.join(foldersPath, folder);
        const commandFiles: string[] = fs
            .readdirSync(commandsPath)
            .filter((file) => file.endsWith(".ts"));
        for (const file of commandFiles) {
            const filePath: string = path.join(commandsPath, file);
            const commandObj = (await import(filePath)).default;
            if (commandObj && "data" in commandObj && "execute" in commandObj)
                commands.push(commandObj as CommandObj);
            // } else {
            //     // console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            // }
        }
    }

    return commands;
};
