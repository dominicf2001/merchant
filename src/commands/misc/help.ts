import { Commands, Items } from '../../database/db-objects';
import { PaginatedMenuBuilder, findTextArgs } from '../../utilities';
import { Message, Events, ButtonInteraction, EmbedBuilder } from 'discord.js';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { client } from '../../index';

const data: Command = {
    command_id: 'help' as CommandsCommandId,
    description: `Displays available commands or displays info on a command/item.`,
    cooldown_time: 0,
    is_admin: false
};

// TODO: implement paging
export default {
	data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        if (args.length){
            const name = findTextArgs(args)[0].toLowerCase();
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle(`${name}`);

            const command = await Commands.get(name);

            if (command) {
                embed.addFields({
                    name: `${command.command_id}`,
                    value: ` `
                });
                embed.setDescription(`${command.description}`);
                await message.reply({ embeds: [embed] });
                return;
            }


            const item = await Items.get(name);
            
            if (item){
                embed.addFields({
                    name: `${item.item_id}`,
                    value: ` `
                });
                embed.setDescription(`${item.description}`);
                await message.reply({ embeds: [embed] });
                return;
            }

            await message.reply("This item or command does not exist.");

        } else {
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle("Available commands.")
                .setDescription("$help [command/item] for additional info on a specific command/item's usage.");

            const commands = await Commands.getAll();
            
            commands.forEach(command => {
                embed.addFields({
                    name: `$${command.command_id}`,
                    value: command.description
                });
            });
            
            await message.reply({ embeds: [embed] });
        }
	},
};
