import QuickChart from "quickchart-js";
import { StocksFactory, UsersFactory } from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    STOCKDOWN_EMOJI_CODE,
    STOCKUP_EMOJI_CODE,
    formatNumber,
    findNumericArgs,
    findTextArgs,
    PaginatedMenuBuilder,
    client,
    CommandOptions,
    CommandResponse,
    makeChoices,
} from "../../utilities";
import {
    Message,
    EmbedBuilder,
    AttachmentBuilder,
    inlineCode,
    Events,
    ButtonInteraction,
    SlashCommandBuilder,
    GuildMember,
    User,
    InteractionReplyOptions,
} from "discord.js";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { DateTime } from "luxon";
import { ChartConfiguration } from "chart.js";
import { StockInterval } from "../../database/datastores/Stocks";

const STOCK_LIST_ID: string = "stock";
const STOCK_LIST_PAGE_SIZE: number = 5;

const data: Partial<Command> = {
    command_id: "stock" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("stock")
      .setDescription("View the stock list or a stock chart")
      .addUserOption(o => o.setName("user").setDescription("the stock to view"))
      .addNumberOption(o => o.setName("page").setDescription("the page to view at"))
      .addStringOption(o => o
        .setName("interval")
        .setDescription("the interval to view at")
        .addChoices(makeChoices("minute", "hour", "day", "month"))),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {

        const user = options.getUser("user", false)
        if (user) {
            const interval = options.getString("interval", false)
            return sendStockChart(member, user, interval);
        } else {
            let pageNum: number = options.getNumber("page", false) || 1;
            await sendStockList(
                member,
                STOCK_LIST_ID,
                STOCK_LIST_PAGE_SIZE,
                pageNum,
            );
        }
    },
};

async function sendStockChart(member: GuildMember, stockUser: User, intervalOption: string | undefined): Promise<CommandResponse> {
    const Stocks = StocksFactory.get(member.guild.id);

    const validIntervals: StockInterval[] = ["minute", "hour", "day", "month"];
    const intervalArg = intervalOption ?? "minute";
    const interval: StockInterval | undefined = validIntervals.find((vi) => vi === intervalArg);

    if (!interval) {
        throw new Error("Invalid interval.");
    }

    const latestStock = await Stocks.get(stockUser.id);
    if (!latestStock) {
        throw new Error("This stock does not exist.");
    }

    const stockHistory = (await Stocks.getStockHistory(stockUser.id, interval)).reverse();
    const initialPrice = stockHistory.length > 0 ? stockHistory[0].price : 0;
    const priceBounds = stockHistory.reduce(
        ({ highest, lowest }, h) => {
            return {
                highest: Math.max(highest, h.price),
                lowest: Math.min(lowest, h.price),
            };
        },
        { highest: initialPrice, lowest: initialPrice },
    );

    const highestPrice: number = Math.round(priceBounds.highest);
    const lowestPrice: number = Math.round(priceBounds.lowest);

    const previousPrice: number =
        stockHistory[stockHistory.length - 2]?.price ?? 0;
    const currentPrice: number =
        stockHistory[stockHistory.length - 1]?.price ?? 0;
    const difference: number = currentPrice - previousPrice;

    const arrow = difference < 0 ? STOCKDOWN_EMOJI_CODE : STOCKUP_EMOJI_CODE;

    const stockDownColor: string = "rgb(255, 0, 0)";
    const stockUpColor: string = "rgb(0, 195, 76)";
    const lineColor: string = difference < 0 ? stockDownColor : stockUpColor;

    const volume = await Stocks.getTotalSharesPurchased(stockUser.id);

    let dateFormat: string;
    switch (interval) {
        case "minute":
            dateFormat = "h:mm:ss";
            break;
        case "hour":
            dateFormat = "MMM dd, h:mm a";
            break;
        case "day":
            dateFormat = "MMM dd";
            break;
        case "month":
            dateFormat = "MMM";
            break;
        default:
            dateFormat = "yyyy-MM-dd";
            break;
    }

    const configuration: ChartConfiguration = {
        type: "line",
        data: {
            labels: stockHistory
                .map((h) => DateTime.fromSQL(h.created_date).toFormat(dateFormat)),
            datasets: [
                {
                    label: `Stock price (${interval})`,
                    data: stockHistory.map((h) => h.price),
                    fill: false,
                    borderColor: lineColor,
                    borderWidth: 4,
                    pointBackgroundColor: lineColor,
                    pointRadius: 0,
                },
            ],
        },
        options: {
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: 24,
                        },
                        color: "#ffffff",
                    },
                    grid: {
                        display: false,
                    },
                },
                y: {
                    min: lowestPrice * 0.95,
                    max: highestPrice * 1.05,
                    ticks: {
                        font: {
                            size: 24,
                        },
                        color: "#cccccc",
                    },
                    grid: {
                        color: "rgba(255, 255, 255, 0.1)",
                    },
                },
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 30,
                        },
                        color: "#ffffff",
                    },
                },
            },
            elements: {
                line: {
                    tension: 0.4, // smoothing
                },
            },
        },
    };

    const chart = new QuickChart();
    chart.setConfig(configuration)
        .setWidth(1200)
        .setHeight(600)
    const attachment = new AttachmentBuilder((await chart.toBinary()));

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle(
            `${arrow} ${inlineCode(stockUser.username)} - ${CURRENCY_EMOJI_CODE} ${formatNumber(currentPrice)}`,
        )
        .setDescription(
            `High: ${CURRENCY_EMOJI_CODE} ${formatNumber(highestPrice)}\nLow: ${CURRENCY_EMOJI_CODE} ${formatNumber(lowestPrice)}\nVolume: :bar_chart: ${formatNumber(volume)}`,
        )
        .setImage("attachment://chart.png");

    return { embeds: [embed], files: [attachment] };
}

async function sendStockList(
    member: GuildMember,
    id: string,
    pageSize: number = 5,
    pageNum: number = 1,
): Promise<InteractionReplyOptions> {
    const Users = UsersFactory.get(member.guild.id);
    const Stocks = StocksFactory.get(member.guild.id);

    const startIndex: number = (pageNum - 1) * pageSize;
    const endIndex: number = startIndex + pageSize;

    const stocks = await Stocks.getAll();
    const slicedStocks = stocks.slice(startIndex, endIndex);

    // getting the 'minute' stock history pulls from a cache
    const histories = await Promise.all(
        stocks.map((s) => Stocks.getStockHistory(s.stock_id, "minute")),
    );

    const totalPages = Math.ceil(stocks.length / pageSize);
    const paginatedMenu = new PaginatedMenuBuilder(
        id,
        pageSize,
        pageNum,
        totalPages,
    )
        .setColor("Blurple")
        .setTitle("Stocks :chart_with_upwards_trend:")
        .setDescription(
            `To view additional info: ${inlineCode("$stock @user")}.`,
        );

    let i = 0;
    for (const stock of slicedStocks) {
        const previousPrice = histories[i++][1]?.price ?? 0;
        const currentPrice = stock.price;
        const stockUser = await Users.get(stock.stock_id);
        const arrow =
            currentPrice - previousPrice < 0
                ? STOCKDOWN_EMOJI_CODE
                : STOCKUP_EMOJI_CODE;

        paginatedMenu.addFields({
            name: `${arrow} ${inlineCode(stockUser.username)} - ${CURRENCY_EMOJI_CODE} ${formatNumber(stock.price)}`,
            value: `${"Previous tick:"} ${CURRENCY_EMOJI_CODE} ${formatNumber(previousPrice)}`,
        });
    }

    const embed = paginatedMenu.createEmbed();
    const buttons = paginatedMenu.createButtons();
    return { embeds: [embed], components: [buttons] };
}

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isButton()) {
            return;
        }

        const { customId } = interaction;

        if (![`${STOCK_LIST_ID}Previous`, `${STOCK_LIST_ID}Next`].includes(customId))
            return;

        let pageNum = parseInt(
            interaction.message.embeds[0].description.match(/Page (\d+)/)[1],
        );
        pageNum =
            customId === `${STOCK_LIST_ID}Previous`
                ? (pageNum = Math.max(pageNum - 1, 1))
                : pageNum + 1;

        // TODO: there has to be a better way to do this
        const reply = await sendStockList(
            interaction.message.member,
            STOCK_LIST_ID,
            STOCK_LIST_PAGE_SIZE,
            pageNum,
        );
        await interaction.update({
          embeds: reply.embeds,
          components: reply.components,
        });
    } catch (error) {
        console.error(error);
    }
});
