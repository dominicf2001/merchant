"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const SHOP_ID = 'shop';
const SHOP_PAGE_SIZE = 5;
const data = {
    command_id: 'shop',
    description: `View the shop`,
    usage: `${(0, discord_js_1.inlineCode)("$shop")}`,
    cooldown_time: 0,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        const pageNum = +(0, utilities_1.findNumericArgs)(args)[0] || 1;
        await sendShopMenu(message, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
    }
};
// TODO: abstract this?
async function sendShopMenu(message, id, pageSize = 5, pageNum = 1) {
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = await db_objects_1.Items.getAll();
    const slicedItems = items
        .sort((itemA, itemB) => itemA.price - itemB.price)
        .slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / pageSize);
    const paginatedMenu = new utilities_1.PaginatedMenuBuilder(id, pageSize, pageNum, totalPages)
        .setColor('Blurple')
        .setTitle('Shop')
        .setDescription(`To view additional info on an item, see ${(0, discord_js_1.inlineCode)("$help [item]")}.`);
    slicedItems.forEach(item => {
        paginatedMenu.addFields({ name: `${item.emoji_code} ${item.item_id} - ${utilities_1.CURRENCY_EMOJI_CODE} - ${(0, utilities_1.formatNumber)(item.price)}`, value: `${item.description}` });
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
    if (![`${SHOP_ID}Previous`, `${SHOP_ID}Next`].includes(customId))
        return;
    const authorId = interaction.message.mentions.users.first().id;
    if (interaction.user.id !== authorId)
        return;
    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
    pageNum = (customId === `${SHOP_ID}Previous`) ?
        pageNum = Math.max(pageNum - 1, 1) :
        pageNum + 1;
    await sendShopMenu(interaction, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
});
