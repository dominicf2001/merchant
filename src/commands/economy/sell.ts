import { UsersFactory, Items, Stocks } from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    formatNumber,
    findNumericArgs,
    findTextArgs,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, EmbedBuilder, inlineCode } from "discord.js";

const data: Partial<Command> = {
    command_id: "sell" as CommandsCommandId,
    description: `sell an item or a stock`,
    usage: `${inlineCode("$sell [item/@user]")}\n${inlineCode("$sell [item/@user] [#amount/all]")}`,
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        if (message.mentions.users.size == 1) {
            await sellStock(message, args);
        } else {
            await sellItem(message, args);
        }
    },
};

async function sellStock(message: Message, args: string[]): Promise<void> {
    const Users = UsersFactory.get(message.guildId);

    const stockUser = message.mentions.users.first();
    const quantity: number = args.includes("all")
        ? 99999
        : +findNumericArgs(args)[0] || 1;

    const latestStock = await Stocks.get(stockUser.id);

    if (!latestStock) {
        throw new Error(`That stock does not exist.`);
    }

    if (message.author.id === stockUser.id) {
        throw new Error(`You cannot own your own stock.`);
    }

    if (!Number.isInteger(quantity)) {
        throw new Error(`You can only sell a whole number of shares.`);
    }

    if (quantity <= 0) {
        throw new Error(`You can only sell one or more shares.`);
    }

    let userStocks = await Users.getUserStocks(message.author.id, stockUser.id);

    if (!userStocks.length) {
        throw new Error(`You do not own any shares of this stock.`);
    }
    const totalSold: number = -(await Users.addStock(
        message.author.id,
        stockUser.id,
        -quantity,
    ));
    const totalReturn: number = latestStock.price * totalSold;

    await Users.addBalance(message.author.id, totalReturn);

    const pluralS: string = totalSold > 1 ? "s" : "";
    const embed = new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalSold)} share${pluralS} of ${inlineCode(stockUser.tag)} sold for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalReturn)}`,
        value: " ",
    });

    await message.reply({ embeds: [embed] });
}

async function sellItem(message: Message, args: string[]): Promise<void> {
    const Users = UsersFactory.get(message.guildId);

    const itemName: string =
        findTextArgs(args)[0]?.toLowerCase() === "all"
            ? findTextArgs(args)[1]?.toLowerCase()
            : findTextArgs(args)[0]?.toLowerCase();

    const quantity: number = args.includes("all")
        ? 99999
        : +findNumericArgs(args)[0] || 1;

    if (!itemName) {
        throw new Error(`Please specify an item or stock.`);
    }

    const item = await Items.get(itemName);

    if (!item) {
        throw new Error(`That item does not exist.`);
    }

    if (!Number.isInteger(quantity)) {
        throw new Error(`You can only sell a whole number of items.`);
    }

    if (quantity <= 0) {
        throw new Error(`You can only sell one or more items.`);
    }

    const userItem = await Users.getItem(message.author.id, itemName);

    if (!userItem) {
        throw new Error(`You do not have this item.`);
    }

    const totalSold: number = -(await Users.addItem(
        message.author.id,
        itemName,
        -quantity,
    ));
    const totalReturn: number = item.price * totalSold;

    await Users.addBalance(message.author.id, totalReturn);

    const pluralS: string = totalSold > 1 ? "s" : "";
    const embed = new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalSold)} ${item.emoji_code} ${itemName}${pluralS} sold for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalReturn)}`,
        value: " ",
    });
    await message.reply({ embeds: [embed] });
}
