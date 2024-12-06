import { APIApplicationCommandOption, ApplicationCommandOptionType, ButtonBuilder, CacheType, CommandInteractionOptionResolver, EmbedBuilder, inlineCode, InteractionReplyOptions, SlashCommandBuilder } from "discord.js";
import fs from "fs";
import path from "path";

export type CommandObj = { data: any; execute: any };

export type CommandResponse = InteractionReplyOptions | EmbedBuilder | string;
export type CommandOptions = Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">

export const buildUsageTag = (metadata: SlashCommandBuilder) => {
    const options = metadata.options.map(option => {
      const data = option as unknown as APIApplicationCommandOption;
      let prefix = "";
      switch (data.type) {
        case ApplicationCommandOptionType.User: prefix = "@"; break;
        case ApplicationCommandOptionType.Number: prefix = "#"; break;
      }
      return data.required ? `[${prefix}${data.name}]` : `(${prefix}${data.name})`;
    })
    return inlineCode([ `/${metadata.name}`, ...options ].join(" "))
  }

export const makeChoices = (...choices: string[]) => {
  return choices.map(choice => ({ name: choice, value: choice }))
}

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
