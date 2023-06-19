const { EmbedBuilder, inlineCode, AttachmentBuilder } = require('discord.js');
const { tendieIconCode, formatNumber } = require("../../utilities.js");
const { getPortfolio, getPortfolioStock } = require('../../database/utilities/stockUtilities.js');

module.exports = {
    data: {
        name: 'pf',
        description: 'View your portfolio.'
    },
    async execute(message, args) {
        if (args[0]) {
            try {
                await handleDetailReply(message, args);
            } catch (error) {
                console.error("Error handling chart reply: ", error);
            }
        } else {
            try {
                await handleListReply(message, args);
            } catch (error) {
                console.error("Error handling list reply: ", error);
            }
        }
    }
};

async function handleListReply(message, args) {
    const portfolio = await getPortfolio(message.author.id);
    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(`To view additional info on a stock: ${inlineCode("$pf @user [page#]")}`);

    let totalValue = 0;
    let totalChange = 0;
    for (const stockId in portfolio){
        const stock = portfolio[stockId];
        let arrow = stock.gainOrLoss < 0 ?
            "<:stockdown:1119370974140301352>" :
            "<:stockup:1119370943240863745>";
        const gainedOrLost = stock.gainOrLoss < 0 ?
            "lost" :
            "gained";

        const user = await message.client.users.fetch(stockId);
        totalValue += Number(stock.total_purchase_price) + Number(stock.gainOrLoss);
        totalChange += Number(stock.gainOrLoss);
        embed.addFields({ name: `${arrow} ${inlineCode(user.username)} ${tendieIconCode} ${formatNumber(stock.gainOrLoss)} ${gainedOrLost} all time`,
            value: `Total shares: :receipt: ${formatNumber(stock.total_shares)}\nTotal invested: ${tendieIconCode} ${formatNumber(stock.total_purchase_price)}`});
    }

    arrow = totalChange < 0 ?
        "<:stockdown:1119370974140301352>" :
        "<:stockup:1119370943240863745>";

    embed.setTitle(`Portfolio :page_with_curl:\nValue: ${tendieIconCode} ${formatNumber(totalValue)} (${arrow} ${formatNumber(totalChange)})`);

    return await message.reply({ embeds: [embed] });
}

async function handleDetailReply(message, args) {
    const pageNum = args.find(arg => !isNaN(arg)) ?? 1;
    const stockUser = message.mentions.users.first();
    const stockId = stockUser.id;
    const portfolioStock = await getPortfolioStock(message.author.id, stockId, pageNum);

    if (!portfolioStock?.length){
        return await message.reply("No history.");
    }

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle(`${inlineCode(stockUser.username)} Purchase History :page_with_curl:`)

    const options = {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };

    for (const stock of portfolioStock) {
        const formattedDate = stock.purchase_date.toLocaleString('en-US', options);
        embed.addFields({ name: `${formattedDate}`, value: `Shares purchased: :receipt: ${formatNumber(stock.shares)}\nPurchase price: ${tendieIconCode} ${formatNumber(stock.purchase_price)}` });
    }

    return await message.reply({ embeds: [embed] });
}
