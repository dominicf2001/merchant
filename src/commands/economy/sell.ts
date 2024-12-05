import { UsersFactory, ItemsFactory, StocksFactory } from "../../database/db-objects";
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
import { Message, EmbedBuilder, inlineCode, SlashCommandBuilder, GuildMember, User } from "discord.js";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const data: Partial<Command> = {
    command_id: "sell" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("sell")
      .setDescription("sell an item or a stock")
      .addUserOption(o => o.setName("user").setDescription("the stock to sell to"))
      .addStringOption(o => o.setName("item").setDescription("the item to sell"))
      .addNumberOption(o => o.setName("amount").setDescription("the amount to sell")),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
      const amount = options.getNumber("amount", true);

      const user = options.getUser("user", false);
      if (user) return sellStock(member, amount, user);

      const item = options.getString("item", false);
      if (item) return sellItem(member, amount, item);

      throw new Error("You must either specify a stock or an item to sell.")
    },
};

async function sellStock(member: GuildMember, quantity: number, stockUser: User): Promise<CommandResponse> {
    const Users = UsersFactory.get(member.guild.id);
    const Stocks = StocksFactory.get(member.guild.id);

    const latestStock = await Stocks.get(stockUser.id);
    if (!latestStock) {
        throw new Error(`That stock does not exist.`);
    }

    if (member.id === stockUser.id) {
        throw new Error(`You cannot own your own stock.`);
    }

    if (!Number.isInteger(quantity)) {
        throw new Error(`You can only sell a whole number of shares.`);
    }

    if (quantity <= 0) {
        throw new Error(`You can only sell one or more shares.`);
    }

    let userStocks = await Users.getUserStocks(member.id, stockUser.id);

    if (!userStocks.length) {
        throw new Error(`You do not own any shares of this stock.`);
    }
    const totalSold: number = -(await Users.addStock(
        member.id,
        stockUser.id,
        -quantity,
    ));
    const totalReturn: number = latestStock.price * totalSold;

    await Users.addBalance(member.id, totalReturn);

    const pluralS: string = totalSold > 1 ? "s" : "";
    return new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalSold)} share${pluralS} of ${inlineCode(stockUser.tag)} sold for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalReturn)}`,
        value: " ",
    });
}

async function sellItem(member: GuildMember, quantity: number, itemName: string): Promise<CommandResponse> {
    const Users = UsersFactory.get(member.guild.id);
    const Items = ItemsFactory.get(member.guild.id);

    itemName = itemName.toLowerCase()
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

    const userItem = await Users.getItem(member.id, itemName);

    if (!userItem) {
        throw new Error(`You do not have this item.`);
    }

    const totalSold: number = -(await Users.addItem(
        member.id,
        itemName,
        -quantity,
    ));
    const totalReturn: number = item.price * totalSold;

    await Users.addBalance(member.id, totalReturn);

    const pluralS: string = totalSold > 1 ? "s" : "";
    return new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalSold)} ${item.emoji_code} ${itemName}${pluralS} sold for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalReturn)}`,
        value: " ",
    });
}
