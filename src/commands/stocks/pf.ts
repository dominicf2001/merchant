import { UsersFactory, StocksFactory } from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    STOCKDOWN_EMOJI_CODE,
    STOCKUP_EMOJI_CODE,
    formatNumber,
    findNumericArgs,
    CommandOptions,
    CommandResponse,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, EmbedBuilder, inlineCode, SlashCommandBuilder, GuildMember, User } from "discord.js";
import { DateTime } from "luxon";

const data: Partial<Command> = {
    command_id: "pf" as CommandsCommandId,
    cooldown_time: 0,
    metadata: new SlashCommandBuilder()
      .setName("pf")
      .setDescription("View your portfolio")
      .addUserOption(o => o.setName("user").setDescription("the user to view the portfolio of"))
      .addNumberOption(o => o.setName("page").setDescription("the page of the purchase list to view")),
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {

        const target = options.getUser("user", false);
        if (target) {
            const page = options.getNumber("page", false);
            return sendPurchaseHistoryList(member, target, page);
        } else {
            return sendStockList(member);
        }
    },
};

async function sendStockList(member: GuildMember): Promise<CommandResponse> {
    const Users = UsersFactory.get(member.guild.id);
    const Stocks = StocksFactory.get(member.guild.id);

    const portfolio = await Users.getPortfolio(member.id);

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setDescription(
            `To view additional info: ${inlineCode("$pf [@user] [page #]")}`,
        );

    let totalValue: number = 0;
    let totalChange: number = 0;
    for (const stock of portfolio) {
        const userStocks = await Users.getUserStocks(
            member.id,
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

        const stockUser = await Users.get(stock.stock_id);
        totalValue += purchaseValue + gain;
        totalChange += gain;
        embed.addFields({
            name: `${arrow} ${inlineCode(stockUser.username)} ${CURRENCY_EMOJI_CODE} ${formatNumber(gain)} ${gainedOrLost} all time`,
            value: `Total shares: :receipt: ${formatNumber(quantity)}\nTotal invested: ${CURRENCY_EMOJI_CODE} ${formatNumber(purchaseValue)}`,
        });
    }

    const arrow: string =
        totalChange < 0 ? STOCKDOWN_EMOJI_CODE : STOCKUP_EMOJI_CODE;

    embed.setTitle(
        `Portfolio :page_with_curl:\nValue: ${CURRENCY_EMOJI_CODE} ${formatNumber(totalValue)} (${arrow} ${formatNumber(totalChange)})`,
    );

    return embed;
}

async function sendPurchaseHistoryList(member: GuildMember, stockUser: User, page: number = 1): Promise<CommandResponse> {
    const Users = UsersFactory.get(member.guild.id);

    // TODO: implement paging
    const stockId = stockUser.id;
    const userStocks = await Users.getUserStocks(member.id, stockId);

    if (!userStocks?.length) {
        return "No history.";
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

    return embed;
}
