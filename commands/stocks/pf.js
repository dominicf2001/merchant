const { EmbedBuilder, inlineCode, AttachmentBuilder } = require('discord.js');
const { tendieIconCode } = require("../../utilities.js");
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
    for (const stockId in portfolio){
        const stock = portfolio[stockId];
        const arrow = stock.gainOrLoss < 0 ?
            "<:stockdown:1117496855870328833>" :
            "<:stockup:1117496842867982407>";
        const gainedOrLost = stock.gainOrLoss < 0 ?
            "lost" :
            "gained";

        const user = await message.client.users.fetch(stockId);
        totalValue += (stock.total_purchase_price + stock.gainOrLoss);
        embed.addFields({ name: `${arrow} ${inlineCode(user.username)} - ${tendieIconCode} ${stock.gainOrLoss} ${gainedOrLost}`,
            value: `Total shares: :receipt: ${stock.total_shares}\nTotal invested: ${tendieIconCode} ${stock.total_purchase_price}`  });
    }

    embed.setTitle(`Portfolio :page_with_curl: - Value: ${tendieIconCode} ${totalValue}`)

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
        embed.addFields({ name: `${formattedDate}`, value: `Shares purchased: :receipt: ${stock.shares}\nPurchase price: ${tendieIconCode} ${stock.purchase_price}` });
    }

    return await message.reply({ embeds: [embed] });
}
