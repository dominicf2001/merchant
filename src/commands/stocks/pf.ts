import { Users, Items, Stocks } from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    STOCKDOWN_EMOJI_CODE,
    STOCKUP_EMOJI_CODE,
    formatNumber,
    findNumericArgs,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, EmbedBuilder, inlineCode } from "discord.js";
import { DateTime } from "luxon";

const data: Command = {
    command_id: "pf" as CommandsCommandId,
    description: `View your portfolio`,
    cooldown_time: 0,
    usage: `${inlineCode("$pf")}\n${inlineCode("$pf [@user]")}`,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        if (args[0]) {
            await sendPurchaseHistoryList(message, args);
        } else {
            await sendStockList(message, args);
        }
    },
};

async function sendStockList(message: Message, args: string[]): Promise<void> {
    const portfolio = await Users.getPortfolio(message.author.id);

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(
            `To view additional info: ${inlineCode("$pf [@user] [page #]")}`,
        );

    let totalValue: number = 0;
    let totalChange: number = 0;
    for (const stock of portfolio) {
        const userStocks = await Users.getUserStocks(
            message.author.id,
            stock.stock_id,
        );

        let purchaseValue: number = 0;
        let quantity: number = 0;
        for (const userStock of userStocks) {
            quantity += userStock.quantity;
            purchaseValue += userStock.quantity * userStock.purchase_price;
        }

        const latestStockPrice: number = (
            await Stocks.get(stock.stock_id)
        ).price;
        const latestValue: number = quantity * latestStockPrice;
        const gain: number = latestValue - purchaseValue;

        const arrow: string =
            gain < 0 ? STOCKDOWN_EMOJI_CODE : STOCKUP_EMOJI_CODE;
        const gainedOrLost: string = gain < 0 ? "lost" : "gained";

        const user = await message.client.users.fetch(stock.stock_id);
        totalValue += purchaseValue + gain;
        totalChange += gain;
        embed.addFields({
            name: `${arrow} ${inlineCode(user.username)} ${CURRENCY_EMOJI_CODE} ${formatNumber(gain)} ${gainedOrLost} all time`,
            value: `Total shares: :receipt: ${formatNumber(quantity)}\nTotal invested: ${CURRENCY_EMOJI_CODE} ${formatNumber(purchaseValue)}`,
        });
    }

    const arrow: string =
        totalChange < 0 ? STOCKDOWN_EMOJI_CODE : STOCKUP_EMOJI_CODE;

    embed.setTitle(
        `Portfolio :page_with_curl:\nValue: ${CURRENCY_EMOJI_CODE} ${formatNumber(totalValue)} (${arrow} ${formatNumber(totalChange)})`,
    );

    await message.reply({ embeds: [embed] });
}

async function sendPurchaseHistoryList(
    message: Message,
    args: string[],
): Promise<void> {
    // TODO: implement paging
    const pageNum: number = +findNumericArgs(args)[0] ?? 1;
    const stockUser = message.mentions.users.first();
    const stockId = stockUser.id;
    const userStocks = await Users.getUserStocks(message.author.id, stockId);

    if (!userStocks?.length) {
        await message.reply("No history.");
        return;
    }

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle(
            `${inlineCode(stockUser.username)} Purchase History :page_with_curl:`,
        );

    for (const userStock of userStocks) {
        const purchaseDate: string = DateTime.fromSQL(
            userStock.purchase_date,
        ).toString();
        embed.addFields({
            name: `${purchaseDate}`,
            value: `Shares purchased: :receipt: ${formatNumber(userStock.quantity)}\nPurchase price: ${CURRENCY_EMOJI_CODE} ${formatNumber(userStock.purchase_price)}`,
        });
    }

    await message.reply({ embeds: [embed] });
}
