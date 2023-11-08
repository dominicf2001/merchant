import { ChartJSNodeCanvas } from'chartjs-node-canvas';
import { Stocks } from '@database';
import { CURRENCY_EMOJI_CODE, STOCKDOWN_EMOJI_CODE,STOCKUP_EMOJI_CODE, formatNumber, findNumericArgs, findTextArgs } from '@utilities';
import { Message, EmbedBuilder, AttachmentBuilder, inlineCode } from 'discord.js';
import { DateTime } from 'luxon';
import { ChartConfiguration } from 'chart.js';

const width = 3000;
const height = 1400;
const backgroundColour = "white";

module.exports = {
    data: {
        name: 'stock',
        description: 'View stocks.'
    },
    async execute(message: Message, args: string[]): Promise<void> {
        if (message.mentions.users.first()) {
            try {
                await handleChartReply(message, args);
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
    },
};

// TODO: move this out
type StockInterval = 'now' | 'hour' | 'day' | 'month';
async function handleChartReply(message: Message, args: string[]): Promise<void> {
    const stockUser = message.mentions.users.first();
    const validIntervals: StockInterval[] = ['now', 'hour', 'day', 'month'];
    const intervalArg = findTextArgs(args)[0];
    const interval: StockInterval | undefined = validIntervals.find(vi => vi === intervalArg);

    if (!interval){
        await message.reply("Invalid interval.");
        return;
    }

    const latestStock = await Stocks.getLatestStock(stockUser.id);
    if (!latestStock) {
        await message.reply("This stock does not exist.");
        return;
    }

    const stockHistory = await Stocks.getStockHistory(stockUser.id, interval);
    const initialPrice = stockHistory.length > 0 ? stockHistory[0].price : 0;
    const priceBounds = stockHistory.reduce(({ highest, lowest }, h) => {
        return {
            highest: Math.max(highest, h.price),
            lowest: Math.min(lowest, h.price)
        };
    }, { highest: initialPrice, lowest: initialPrice });

    const highestPrice: number = Math.round(priceBounds.highest);
    const lowestPrice: number = Math.round(priceBounds.lowest);

    const previousPrice: number = stockHistory[stockHistory.length - 2]?.price ?? 0;
    const currentPrice: number = stockHistory[stockHistory.length - 1]?.price ?? 0;
    const difference: number = currentPrice - previousPrice;

    const arrow = difference < 0 ?
        STOCKDOWN_EMOJI_CODE : 
        STOCKUP_EMOJI_CODE;

    const stockDownColor: string = "rgb(255, 0, 0)";
    const stockUpColor: string = "rgb(0, 195, 76)";
    const lineColor: string = difference < 0 ?
        stockDownColor :
        stockUpColor;


    const volume = await Stocks.getTotalSharesPurchased(stockUser.id);

    let dateFormat: string;
    switch (interval) {
        case 'now':
            dateFormat = 'h:mm:ss';
            break;
        case 'hour':
            dateFormat = 'MMM dd, h:mm a';
            break;
        case 'day':
            dateFormat = 'MMM dd';
            break;
        case 'month':
            dateFormat = 'MMM';
            break;
        default:
            dateFormat = 'yyyy-MM-dd';
            break;
    }
    
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });
    const configuration: ChartConfiguration = {
        type: 'line',
        data: {
            labels: stockHistory.map(h => DateTime.fromISO(h.created_date).toFormat(dateFormat)),
            datasets: [{
                label: `Stock price (${interval})`,
                data: stockHistory.map(h => h.price),
                fill: false,
                borderColor: lineColor
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
                            size: 60
                        }
                    }
                }
            }
        }
    };

    const image = await chartJSNodeCanvas.renderToBuffer(configuration);
    const attachment = new AttachmentBuilder(image);

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle(`${arrow} ${inlineCode(stockUser.username)} - ${CURRENCY_EMOJI_CODE} ${formatNumber(currentPrice)}`)
        .setDescription(`High: ${CURRENCY_EMOJI_CODE} ${formatNumber(highestPrice)}\nLow: ${CURRENCY_EMOJI_CODE} ${formatNumber(lowestPrice)}\nVolume: :bar_chart: ${formatNumber(volume)}`)
        .setImage('attachment://chart.png');

    await message.reply({ embeds: [embed], files: [attachment] });
}



async function handleListReply(message, args, isUpdate) {
    let pageNum = findNumericArgs(args)[0] ?? 1;
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

        embed.addFields({ name: `${arrow} ${inlineCode(username)} - ${CURRENCY_EMOJI_CODE} ${formatNumber(stock.price)}`, value: `${"Previous:"} ${CURRENCY_EMOJI_CODE} ${formatNumber(previousPrice)}` });
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
