const { EmbedBuilder, inlineCode, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { tendieIconCode } = require("../../utilities.js");
const { getLatestStock, getStockHistory, latestStocksCache, getStockPurchasedShares } = require("../../database/utilities/stockUtilities.js");
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const moment = require('moment');
const { formatNumber } = require("../../utilities.js");
const { client } = require("../../index.js");

const width = 3000;
const height = 1400;
const backgroundColour = "white";

module.exports = {
    data: {
        name: 'stock',
        description: 'View stocks.'
    },
    async execute(message, args) {
        if (message.mentions.users.first()) {
            try {
                handleChartReply(message, args);
            } catch (error) {
                console.error("Error handling chart reply: ", error);
            }
        } else {
            try {
                handleListReply(message, args);
            } catch (error) {
                console.error("Error handling list reply: ", error);
            }
        }
    },
};

async function handleChartReply(message, args) {
    const stockUser = message.mentions.users.first();
    const interval = args[1] ?? "now";
    const intervals = ['now', 'hour', 'day', 'month'];

    if (!intervals.includes(interval) && args[1]){
        return message.reply("Invalid interval.");
    }

    const stockHistory = (await getStockHistory(stockUser.id, interval)).reverse();
    const priceList = stockHistory.map(h => Number(h.dataValues.price));
    const highestPrice = Math.round(Math.max(...priceList));
    const lowestPrice = Math.round(Math.min(...priceList));

    const currentStock = await getLatestStock(stockUser.id);
    if (!currentStock) {
        return message.reply("This stock does not exist.");
    }

    const previousPrice = stockHistory[stockHistory.length - 2]?.price ?? 0;
    const currentPrice = stockHistory[stockHistory.length - 1]?.price ?? 0;
    const difference = Number(currentPrice) - Number(previousPrice);

    const arrow = difference < 0 ? "<:stockdown:1119370974140301352>" : "<:stockup:1119370943240863745>";
    const lineColor = difference < 0 ? "rgb(255, 0, 0)" : "rgb(0, 195, 76)";

    const volume = await getStockPurchasedShares(stockUser.id);
    const dateFormat = interval === 'hour' ? 'MMM DD, h:mm a' : interval === 'day' ? 'MMM DD' : interval === 'now' ? 'h:mm:ss' : 'MMM';

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });
    const configuration = {
        type: 'line',
        data: {
            labels: stockHistory.map(h => moment(h.dataValues[interval]).format(dateFormat)),
            datasets: [{
                label: `Stock price (${interval})`,
                data: stockHistory.map(h => h.price),
                fill: false,
                borderColor: lineColor,
                lineTension: 0.1
            }]
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 33
                        }
                    }
                },
                y: {
                    min: lowestPrice * .97,
                    max: highestPrice * 1.03,
                    ticks: {
                        font: {
                            size: 36
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 60 // this controls the font size of the legend labels
                        }
                    }
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    const attachment = new AttachmentBuilder(image, 'chart.png');

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle(`${arrow} ${inlineCode(stockUser.username)} - ${tendieIconCode} ${formatNumber(currentPrice)}`)
        .setDescription(`High: ${tendieIconCode} ${formatNumber(highestPrice)}\nLow: ${tendieIconCode} ${formatNumber(lowestPrice)}\nVolume: :bar_chart: ${formatNumber(volume)}`)
        .setImage('attachment://chart.png');

    return message.reply({ embeds: [embed], files: [attachment] });
}



async function handleListReply(message, args, isUpdate) {
    let pageNum = args.find(arg => !isNaN(arg)) ?? 1;
    const pageSize = 5;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    const stocks = Array.from(latestStocksCache.values()).slice(startIndex, endIndex);

    const totalPages = Math.ceil(latestStocksCache.size / pageSize);

    if (pageNum > totalPages || pageNum < 1) return;

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle("Stocks :chart_with_upwards_trend:")
        .setDescription(`Page ${pageNum}/${totalPages}\nTo view additional info on a stock: ${inlineCode("$stock @user")}`);

    const previousBtn = new ButtonBuilder()
        .setCustomId('shopPrevious')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageNum == 1);

    const nextBtn = new ButtonBuilder()
        .setCustomId('stockListNext')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageNum == totalPages);

    const buttons = new ActionRowBuilder()
        .addComponents(previousBtn, nextBtn);

    const historiesPromise = Promise.all(stocks.map(s => getStockHistory(s.user_id)));
    const histories = await historiesPromise;

    let i = 0;
    for (const stock of stocks){
        const previousPrice = histories[i][1]?.price ?? 0;
        const currentPrice = stock.price;
        const username = (await message.client.users.fetch(stock.user_id)).username;

        const arrow = (currentPrice - previousPrice) < 0 ?
            "<:stockdown:1119370974140301352>" :
            "<:stockup:1119370943240863745>";

        embed.addFields({ name: `${arrow} ${inlineCode(username)} - ${tendieIconCode} ${formatNumber(stock.price)}`, value: `${"Previous:"} ${tendieIconCode} ${formatNumber(previousPrice)}` });
        ++i;
    };

    if (isUpdate) {
        return message.update({ embeds: [embed], components: [buttons] });
    } else {
        return message.reply({ embeds: [embed], components: [buttons] });
    }
}


client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const { customId } = interaction;

    if (!['stockListPrevious', 'stockListNext'].includes(customId)) return;

    const authorId = interaction.message.mentions.users.first().id;

    if (interaction.user.id !== authorId) return;

    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);

    if (customId === 'stockListPrevious') {
        pageNum = Math.max(pageNum - 1, 1);
    } else if (customId === 'stockListNext') {
        pageNum = pageNum + 1;
    }

    if (authorId === interaction.user.id) {
        handleListReply(interaction, [pageNum], true);
    }
});
