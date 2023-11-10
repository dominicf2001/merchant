"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
module.exports = {
    data: {
        name: 'sell',
        description: `sell an item or a stock.\n${(0, discord_js_1.inlineCode)("$sell [item/@user] [quantity/all]")}`
    },
    async execute(message, args) {
        if (message.mentions.users.size == 1) {
            await sellStock(message, args);
        }
        else {
            await sellItem(message, args);
        }
    }
};
async function sellStock(message, args) {
    const stockUser = message.mentions.users.first();
    const quantity = args.includes("all") ?
        99999 :
        (+(0, utilities_1.findNumericArgs)(args)[0] ?? 1);
    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only sell a whole number of shares.`);
        return;
    }
    if (quantity <= 0) {
        await message.reply(`You can only sell one or more shares.`);
        return;
    }
    if (message.author.id === stockUser.id) {
        await message.reply(`You cannot own your own stock.`);
        return;
    }
    const latestStock = await db_objects_1.Stocks.getLatestStock(stockUser.id);
    if (!latestStock) {
        await message.reply(`That stock does not exist.`);
        return;
    }
    let userStocks = await db_objects_1.Users.getUserStocks(message.author.id, stockUser.id);
    if (!userStocks.length) {
        await message.reply(`You do not own any shares of this stock.`);
        return;
    }
    try {
        const totalSold = await db_objects_1.Users.addStock(message.author.id, stockUser.id, -quantity);
        const totalReturn = latestStock.price * totalSold;
        await db_objects_1.Users.addBalance(message.author.id, totalReturn);
        const pluralS = totalSold > 1 ? "s" : "";
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .addFields({
            name: `${(0, utilities_1.formatNumber)(totalSold)} share${pluralS} of ${(0, discord_js_1.inlineCode)(stockUser.tag)} sold for ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(totalReturn)}`,
            value: ' '
        });
        await message.reply({ embeds: [embed] });
    }
    catch (error) {
        console.error(error);
    }
}
async function sellItem(message, args) {
    const itemName = (0, utilities_1.findTextArgs)(args)[0].toLowerCase();
    const quantity = args.includes("all") ?
        99999 :
        (+(0, utilities_1.findNumericArgs)(args)[0] ?? 1);
    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only sell a whole number of items.`);
        return;
    }
    if (quantity <= 0) {
        await message.reply(`You can only sell one or more items.`);
        return;
    }
    const item = await db_objects_1.Items.get(itemName);
    if (!item) {
        await message.reply(`That item does not exist.`);
        return;
    }
    const userItem = await db_objects_1.Users.getItem(message.author.id, itemName);
    if (!userItem) {
        await message.reply(`You do not have this item.`);
        return;
    }
    try {
        const totalSold = await db_objects_1.Users.addItem(message.author.id, itemName, -quantity);
        const totalReturn = item.price * totalSold;
        await db_objects_1.Users.addBalance(message.author.id, totalReturn);
        const pluralS = quantity > 1 ? "s" : "";
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .addFields({
            name: `${(0, utilities_1.formatNumber)(totalSold)} ${itemName}${pluralS} sold for ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(totalReturn)}`,
            value: ' '
        });
        await message.reply({ embeds: [embed] });
    }
    catch (error) {
        console.error(error);
    }
}
