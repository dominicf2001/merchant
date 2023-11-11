"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const HELP_ID = 'help';
const HELP_PAGE_SIZE = 5;
const data = {
    command_id: 'help',
    description: `Displays available commands or displays info on a command/item.`,
    cooldown_time: 0,
    is_admin: false
};
// TODO: implement paging
exports.default = {
    data: data,
    async execute(message, args) {
        if (args.length) {
            const name = (0, utilities_1.findTextArgs)(args)[0].toLowerCase();
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setTitle(`${name}`);
            const command = await db_objects_1.Commands.get(name);
            if (command) {
                embed.addFields({
                    name: `${command.command_id}`,
                    value: ` `
                });
                embed.setDescription(`${command.description}`);
                await message.reply({ embeds: [embed] });
                return;
            }
            const item = await db_objects_1.Items.get(name);
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
            const pageNum = +(0, utilities_1.findNumericArgs)(args)[0] || 1;
            await sendHelpMenu(message, HELP_ID, HELP_PAGE_SIZE, pageNum);
        }
    },
};
async function sendHelpMenu(message, id, pageSize = 5, pageNum = 1) {
    const paginatedMenu = new utilities_1.PaginatedMenuBuilder(id, pageSize, pageNum)
        .setColor('Blurple')
        .setTitle('Commands')
        .setDescription("$help [command/item] for additional info on a specific command/item's usage");
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const commands = (await db_objects_1.Commands.getAll())
        .filter(command => !command.is_admin)
        .slice(startIndex, endIndex + 1);
    commands.forEach(command => {
        paginatedMenu.addFields({ name: `${command.command_id}`, value: `${command.description}` });
    });
    const embed = paginatedMenu.createEmbed();
    const buttons = paginatedMenu.createButtons();
    message instanceof discord_js_1.ButtonInteraction ?
        await message.update({ embeds: [embed], components: [buttons] }) :
        await message.reply({ embeds: [embed], components: [buttons] });
}
index_1.client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) {
        return;
    }
    const { customId } = interaction;
    if (![`${HELP_ID}Previous`, `${HELP_ID}Next`].includes(customId))
        return;
    const authorId = interaction.message.mentions.users.first().id;
    if (interaction.user.id !== authorId)
        return;
    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
    pageNum = (customId === `${HELP_ID}Previous`) ?
        pageNum = Math.max(pageNum - 1, 1) :
        pageNum + 1;
    await sendHelpMenu(interaction, HELP_ID, HELP_PAGE_SIZE, pageNum);
});
