"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
const discord_js_1 = require("discord.js");
// TODO: implement paging
module.exports = {
    data: {
        name: 'help',
        description: 'Displays available commands or displays info on a command/item.'
    },
    async execute(message, args) {
        if (args.length) {
            const name = (0, _utilities_1.findTextArgs)(args)[0].toLowerCase();
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setTitle(`${name}`);
            const command = await _database_1.Commands.get(name);
            if (command) {
                embed.addFields({
                    name: `${command.command_id}`,
                    value: ` `
                });
                embed.setDescription(`${command.description}`);
                await message.reply({ embeds: [embed] });
                return;
            }
            const item = await _database_1.Items.get(name);
            if (item) {
                embed.addFields({
                    name: `${item.item_id}`,
                    value: ` `
                });
                embed.setDescription(`${item.description}`);
                await message.reply({ embeds: [embed] });
                return;
            }
            await message.reply("This item or command does not exist.");
        }
        else {
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setTitle("Available commands.")
                .setDescription("$help [command/item] for additional info on a specific command/item's usage.");
            const commands = await _database_1.Commands.getAll();
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
