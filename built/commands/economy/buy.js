"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
const data = {
    command_id: 'buy',
    description: `Buy an item or stock`,
    usage: `${(0, discord_js_1.inlineCode)("$buy [item/@user]")}\n${(0, discord_js_1.inlineCode)("$buy [item/@user] [#amount/all]")}`,
    cooldown_time: 0,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        if (message.mentions.users.size === 1) {
            try {
                await buyStock(message, args);
            }
            catch (error) {
                console.error(error);
                await message.reply('An error occurred when buying this stock. Please try again later.');
            }
        }
        else {
            try {
                await buyItem(message, args);
            }
            catch (error) {
                console.error(error);
                await message.reply('An error occurred when buying this item. Please try again later.');
            }
        }
    }
};
async function buyStock(message, args) {
    const stockUser = message.mentions.users.first();
    const quantity = args.includes("all") ?
        99999 :
        (+(0, utilities_1.findNumericArgs)(args)[0] || 1);
    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only purchase a whole number of shares.`);
        return;
    }
    if (quantity <= 0) {
        await message.reply(`You can only purchase one or more shares.`);
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
    const authorBalance = await db_objects_1.Users.getBalance(message.author.id);
    // buy as many as possible
    const totalBought = ((latestStock.price * quantity) > authorBalance || args.includes('all')) ?
        Math.floor(Math.floor((authorBalance / latestStock.price) * 100) / 100) :
        quantity;
    const totalCost = latestStock.price * totalBought;
    await db_objects_1.Users.addStock(message.author.id, stockUser.id, totalBought);
    await db_objects_1.Users.addBalance(message.author.id, -(totalCost));
    const pluralS = quantity > 1 ? "s" : "";
    const embed = new discord_js_1.EmbedBuilder()
        .setColor('Blurple')
        .addFields({
        name: `${(0, utilities_1.formatNumber)(totalBought)} share${pluralS} of ${(0, discord_js_1.inlineCode)(stockUser.tag)} bought for ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(totalCost)}`,
        value: ' '
    });
    await message.reply({ embeds: [embed] });
}
async function buyItem(message, args) {
    const itemName = (0, utilities_1.findTextArgs)(args)[0]?.toLowerCase() === 'all' ?
        (0, utilities_1.findTextArgs)(args)[1]?.toLowerCase() :
        (0, utilities_1.findTextArgs)(args)[0]?.toLowerCase();
    const quantity = args.includes("all") ?
        99999 :
        (+(0, utilities_1.findNumericArgs)(args)[0] || 1);
    if (!itemName) {
        await message.reply(`Please specify an item or stock.`);
        return;
    }
    const item = await db_objects_1.Items.get(itemName);
    if (!item) {
        await message.reply(`That item doesn't exist.`);
        return;
    }
    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only purchase a whole number of items.`);
        return;
    }
    if (quantity <= 0) {
        await message.reply(`You can only purchase one or more items.`);
        return;
    }
    // TODO: move to json parameter file?
    const MAX_ITEM_COUNT = 5;
    const itemCount = await db_objects_1.Users.getItemCount(message.author.id);
    const freeInventorySpace = MAX_ITEM_COUNT - itemCount;
    if (freeInventorySpace <= 0) {
        await message.reply(`You can only store ${MAX_ITEM_COUNT} items at a time.`);
        return;
    }
    // if (user.role < item.role) return message.reply(`Your role is too low to buy this item.`);
    // buy as many as possible
    const authorBalance = await db_objects_1.Users.getBalance(message.author.id);
    let totalBought = ((item.price * quantity) > authorBalance || args.includes('all')) ?
        Math.floor(Math.floor((authorBalance / item.price) * 100) / 100) :
        quantity;
    // Dont exceed max inventory size
    totalBought = (totalBought > freeInventorySpace) ?
        freeInventorySpace :
        totalBought;
    if (!totalBought) {
        await message.reply(`You are too poor to purchase this item.`);
        return;
    }
    const totalCost = item.price * totalBought;
    await db_objects_1.Users.addItem(message.author.id, itemName, totalBought);
    await db_objects_1.Users.addBalance(message.author.id, -totalCost);
    const pluralS = totalBought > 1 ?
        "s" :
        "";
    const embed = new discord_js_1.EmbedBuilder()
        .setColor("Blurple")
        .addFields({
        name: `${(0, utilities_1.formatNumber)(totalBought)} ${item.emoji_code} ${item.item_id}${pluralS} bought for ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(totalCost)}`,
        value: ' '
    });
    await message.reply({ embeds: [embed] });
}
