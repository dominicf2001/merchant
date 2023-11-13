"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
const luxon_1 = require("luxon");
const data = {
    command_id: 'pf',
    description: `View your portfolio`,
    cooldown_time: 0,
    usage: `${(0, discord_js_1.inlineCode)("$pf")}\n${(0, discord_js_1.inlineCode)("$pf [@user]")}`,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        if (args[0]) {
            try {
                await sendPurchaseHistoryList(message, args);
            }
            catch (error) {
                console.error(error);
                await message.reply('An error occurred when getting your portfolio. Please try again later.');
            }
        }
        else {
            try {
                await sendStockList(message, args);
            }
            catch (error) {
                console.error(error);
                await message.reply('An error occurred when getting your portfolio. Please try again later.');
            }
        }
    }
};
async function sendStockList(message, args) {
    const portfolio = await db_objects_1.Users.getPortfolio(message.author.id);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor("Blurple")
        .setDescription(`To view additional info: ${(0, discord_js_1.inlineCode)("$pf [@user] [page #]")}`);
    let totalValue = 0;
    let totalChange = 0;
    for (const stock of portfolio) {
        const userStocks = await db_objects_1.Users.getUserStocks(message.author.id, stock.stock_id);
        let purchaseValue = 0;
        let quantity = 0;
        for (const userStock of userStocks) {
            quantity += userStock.quantity;
            purchaseValue += (userStock.quantity * userStock.purchase_price);
        }
        const latestStockPrice = (await db_objects_1.Stocks.getLatestStock(stock.stock_id)).price;
        const latestValue = quantity * latestStockPrice;
        const gain = latestValue - purchaseValue;
        const arrow = gain < 0 ?
            utilities_1.STOCKDOWN_EMOJI_CODE :
            utilities_1.STOCKUP_EMOJI_CODE;
        const gainedOrLost = gain < 0 ?
            "lost" :
            "gained";
        const user = await message.client.users.fetch(stock.stock_id);
        totalValue += (purchaseValue + gain);
        totalChange += gain;
        embed.addFields({ name: `${arrow} ${(0, discord_js_1.inlineCode)(user.username)} ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(gain)} ${gainedOrLost} all time`,
            value: `Total shares: :receipt: ${(0, utilities_1.formatNumber)(quantity)}\nTotal invested: ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(purchaseValue)}` });
    }
    const arrow = totalChange < 0 ?
        utilities_1.STOCKDOWN_EMOJI_CODE :
        utilities_1.STOCKUP_EMOJI_CODE;
    embed.setTitle(`Portfolio :page_with_curl:\nValue: ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(totalValue)} (${arrow} ${(0, utilities_1.formatNumber)(totalChange)})`);
    await message.reply({ embeds: [embed] });
}
async function sendPurchaseHistoryList(message, args) {
    // TODO: implement paging
    const pageNum = +(0, utilities_1.findNumericArgs)(args)[0] ?? 1;
    const stockUser = message.mentions.users.first();
    const stockId = stockUser.id;
    const userStocks = await db_objects_1.Users.getUserStocks(message.author.id, stockId);
    if (!userStocks?.length) {
        await message.reply("No history.");
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor("Blurple")
        .setTitle(`${(0, discord_js_1.inlineCode)(stockUser.username)} Purchase History :page_with_curl:`);
    for (const userStock of userStocks) {
        const purchaseDate = luxon_1.DateTime.fromISO(userStock.purchase_date).toString();
        embed.addFields({ name: `${purchaseDate}`, value: `Shares purchased: :receipt: ${(0, utilities_1.formatNumber)(userStock.quantity)}\nPurchase price: ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(userStock.purchase_price)}` });
    }
    await message.reply({ embeds: [embed] });
}
