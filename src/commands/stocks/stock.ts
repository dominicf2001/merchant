import { ChartJSNodeCanvas } from'chartjs-node-canvas';
import { Stocks } from '@database';
import { CURRENCY_EMOJI_CODE, STOCKDOWN_EMOJI_CODE,STOCKUP_EMOJI_CODE, formatNumber, findNumericArgs, findTextArgs, PaginatedMenuBuilder } from '@utilities';
import { Message, EmbedBuilder, AttachmentBuilder, inlineCode, Events, ButtonInteraction } from 'discord.js';
import { DateTime } from 'luxon';
import { ChartConfiguration } from 'chart.js';

const STOCK_LIST_ID: string = 'shop';
const STOCK_LIST_PAGE_SIZE: number = 5;

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
                await sendStockChart(message, args);
            } catch (error) {
                console.error("Error handling chart reply: ", error);
            }
        } else {
            try {
                let pageNum: number = +findNumericArgs(args)[0] ?? 1;
                await sendStockList(message, STOCK_LIST_ID, STOCK_LIST_PAGE_SIZE, pageNum);
            } catch (error) {
                console.error("Error handling list reply: ", error);
            }
        }
    },
};

// TODO: move this out
type StockInterval = 'now' | 'hour' | 'day' | 'month';
async function sendStockChart(message: Message, args: string[]): Promise<void> {
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

async function sendStockList(message: Message | ButtonInteraction, id: string, pageSize: number = 5, pageNum: number = 1): Promise<void> {
    const startIndex: number = (pageNum - 1) * pageSize;
    const endIndex: number = startIndex + pageSize;
    
    const stocks = (await Stocks.getLatestStocks()).slice(startIndex, endIndex);

    // getting the 'now' stock history pulls from a cache
    const histories = await Promise.all(stocks.map(s => Stocks.getStockHistory(s.stock_id, 'now')));

    const paginatedMenu = new PaginatedMenuBuilder(id)
        .setColor('Blurple')
        .setTitle('Stocks :chart_with_upwards_trend:')
        .setDescription('To view additional info on a stock: ${inlineCode("$stock @user").');
    
    let i = 0;
    for (const stock of stocks){
        const previousPrice = histories[i][1]?.price ?? 0;
        const currentPrice = stock.price;
        const username = (await message.client.users.fetch(stock.stock_id)).username;

        const arrow = (currentPrice - previousPrice) < 0 ?
            STOCKDOWN_EMOJI_CODE :
            STOCKUP_EMOJI_CODE;

        paginatedMenu.addFields({ name: `${arrow} ${inlineCode(username)} - ${CURRENCY_EMOJI_CODE} ${formatNumber(stock.price)}`, value: `${"Previous:"} ${CURRENCY_EMOJI_CODE} ${formatNumber(previousPrice)}` });
        ++i;
    };

    const embed = paginatedMenu.createEmbed();
    const buttons = paginatedMenu.createButtons();
    
    message instanceof ButtonInteraction ?
        await message.update({ embeds: [embed], components: [buttons] }) :
        await message.reply({ embeds: [embed], components: [buttons] });
}

client.on(Events.InteractionCreate, async (interaction: ButtonInteraction) => {
    const { customId } = interaction;
    
    // Ensure this a paginated menu button (may need more checks here in the future)
    if (!interaction.isButton())
        return false;

    if (![`${STOCK_LIST_ID}Previous`, `${STOCK_LIST_ID}Next`].includes(customId))
        return;

    const authorId = interaction.message.mentions.users.first().id;
    if (interaction.user.id !== authorId)
        return;

    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
    pageNum = (customId === `${STOCK_LIST_ID}Previous`) ?
        pageNum = Math.max(pageNum - 1, 1) :
        pageNum + 1;
    
    await sendStockList(interaction, STOCK_LIST_ID, STOCK_LIST_PAGE_SIZE);
});
