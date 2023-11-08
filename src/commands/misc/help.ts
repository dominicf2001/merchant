import { Items } from '@database';
import { CURRENCY_EMOJI_CODE, formatNumber, findNumericArgs, PaginatedMenuBuilder, findTextArgs } from '@utilities';
import { Message, Events, ButtonInteraction } from 'discord.js';
import { client } from '../../index';

module.exports = {
	data: {
        name: 'help',
        description: 'Displays available commands or displays info on a command/item.'
    },
    async execute(message: Message, args: string[]): Promise<void> {
        if (args.length){
            const name = findTextArgs(args)[0];
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle(`${name}`);

            const command = message.client.commands.find(command => command.data.name == name);

            if (command){
                embed.addFields({
                    name: `${command.data.usage}`,
                    value: ` `
                });
                embed.setDescription(`${command.data.description}`);
                await message.reply({ embeds: [embed] });
            }

            const item = message.client.items.find(item => item.data.name == name);
            if (item){
                embed.addFields({
                    name: `${item.data.usage}`,
                    value: ` `
                });
                embed.setDescription(`${item.data.description}`);
                await message.reply({ embeds: [embed] });
            }


        } else {
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle("Available commands.")
                .setDescription("$help [command/item] for additional info on a specific command/item's usage.");

            message.client.commands.forEach(command => {
                embed.addFields({
                    name: `$${command.data.name}`,
                    value: command.data.description
                });
            });
            await message.reply({ embeds: [embed] });
        }
	},
};
