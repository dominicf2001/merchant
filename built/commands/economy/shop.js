"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
const discord_js_1 = require("discord.js");
const index_1 = require("../../index");
const SHOP_ID = 'shop';
const SHOP_PAGE_SIZE = 5;
module.exports = {
    data: {
        name: 'shop',
        description: 'View the shop.'
    },
    async execute(message, args) {
        const pageNum = +(0, _utilities_1.findNumericArgs)(args)[0] ?? 1;
        await sendShopMenu(message, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
    }
};
// TODO: abstract this?
async function sendShopMenu(message, id, pageSize = 5, pageNum = 1) {
    const paginatedMenu = new _utilities_1.PaginatedMenuBuilder(id)
        .setColor('Blurple')
        .setTitle('Shop')
        .setDescription('To view additional info on an item, see $help [item].');
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = (await _database_1.Items.getAll())
        .sort((itemA, itemB) => itemA.price - itemB.price)
        .slice(startIndex, endIndex + 1);
    items.forEach(item => {
        paginatedMenu.addFields({ name: `${item.emoji_code} ${item.item_id} - ${_utilities_1.CURRENCY_EMOJI_CODE} - ${(0, _utilities_1.formatNumber)(item.price)}`, value: `${item.description}` });
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
    // Ensure this a paginated menu button (may need more checks here in the future)
    if (!interaction.isButton())
        return;
    if (![`${SHOP_ID}Previous`, `${SHOP_ID}Next`].includes(customId))
        return;
    const authorId = interaction.message.mentions.users.first().id;
    if (interaction.user.id !== authorId)
        return;
    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
    pageNum = (customId === `${SHOP_ID}Previous`) ?
        pageNum = Math.max(pageNum - 1, 1) :
        pageNum + 1;
    await sendShopMenu(interaction, SHOP_ID, SHOP_PAGE_SIZE);
});
