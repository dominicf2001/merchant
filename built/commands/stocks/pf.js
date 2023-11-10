"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
const discord_js_1 = require("discord.js");
const luxon_1 = require("luxon");
module.exports = {
    data: {
        name: 'pf',
        description: 'View your portfolio.'
    },
    async execute(message, args) {
        if (args[0]) {
            try {
                await handleDetailReply(message, args);
            }
            catch (error) {
                console.error("Error handling chart reply: ", error);
            }
        }
        else {
            try {
                await handleListReply(message, args);
            }
            catch (error) {
                console.error("Error handling list reply: ", error);
            }
        }
    }
};
async function handleListReply(message, args) {
    const portfolio = await _database_1.Users.getPortfolio(message.author.id);
    const embed = new discord_js_1.EmbedBuilder()
        .setColor("Blurple")
        .setDescription(`To view additional info on a stock: ${(0, discord_js_1.inlineCode)("$pf @user [page#]")}`);
    let totalValue = 0;
    let totalChange = 0;
    for (const stockId in portfolio) {
        const userStocks = await _database_1.Users.getUserStocks(message.author.id, stockId);
        let value = 0;
        let quantity = 0;
        for (const userStock of userStocks) {
            quantity += userStock.quantity;
            value += (userStock.quantity * userStock.purchase_price);
        }
        const latestStockPrice = (await _database_1.Stocks.getLatestStock(stockId)).price;
        const gain = latestStockPrice - totalValue;
        const arrow = gain < 0 ?
            _utilities_1.STOCKDOWN_EMOJI_CODE :
            _utilities_1.STOCKUP_EMOJI_CODE;
        const gainedOrLost = gain < 0 ?
            "lost" :
            "gained";
        const user = await message.client.users.fetch(stockId);
        totalValue += (value + gain);
        totalChange += gain;
        embed.addFields({ name: `${arrow} ${(0, discord_js_1.inlineCode)(user.username)} ${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(gain)} ${gainedOrLost} all time`,
            value: `Total shares: :receipt: ${(0, _utilities_1.formatNumber)(quantity)}\nTotal invested: ${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(value)}` });
    }
    const arrow = totalChange < 0 ?
        _utilities_1.STOCKDOWN_EMOJI_CODE :
        _utilities_1.STOCKUP_EMOJI_CODE;
    embed.setTitle(`Portfolio :page_with_curl:\nValue: ${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(totalValue)} (${arrow} ${(0, _utilities_1.formatNumber)(totalChange)})`);
    await message.reply({ embeds: [embed] });
}
async function handleDetailReply(message, args) {
    // TODO: implement paging
    const pageNum = +(0, _utilities_1.findNumericArgs)(args)[0] ?? 1;
    const stockUser = message.mentions.users.first();
    const stockId = stockUser.id;
    const userStocks = await _database_1.Users.getUserStocks(message.author.id, stockId);
    if (!userStocks?.length) {
        await message.reply("No history.");
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setColor("Blurple")
        .setTitle(`${(0, discord_js_1.inlineCode)(stockUser.username)} Purchase History :page_with_curl:`);
    for (const userStock of userStocks) {
        const purchaseDate = luxon_1.DateTime.fromISO(userStock.purchase_date).toString();
        embed.addFields({ name: `${purchaseDate}`, value: `Shares purchased: :receipt: ${(0, _utilities_1.formatNumber)(userStock.quantity)}\nPurchase price: ${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(userStock.purchase_price)}` });
    }
    await message.reply({ embeds: [embed] });
}
