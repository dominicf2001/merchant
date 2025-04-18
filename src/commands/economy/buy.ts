import {
    UsersFactory,
    ItemsFactory,
    StocksFactory,
} from "../../database/db-objects";
import {
    CommandOptions,
    CommandResponse,
    CURRENCY_EMOJI_CODE,
    formatNumber,
    MAX_INV_SIZE,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import {
    EmbedBuilder,
    inlineCode,
    SlashCommandBuilder,
    GuildMember,
    User,
} from "discord.js";
import { CommandObj } from "src/database/datastores/Commands";

const data: Partial<Command> = {
    command_id: "buy" as CommandsCommandId,
    metadata: new SlashCommandBuilder().setName("buy")
        .setDescription("Buy an item or stock")
        .addNumberOption(o => o.setName("amount").setDescription("the amount to buy").setRequired(true))
        .addUserOption(o => o.setName("stock").setDescription("the stock to buy"))
        .addStringOption(o => o.setName("item").setDescription("the item to buy")),
    cooldown_time: 0,
    is_admin: false,
};

export default <CommandObj>{
    data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const amount = options.getNumber("amount", true);

        const user = options.getUser("stock", false);
        if (user) return buyStock(member, amount, user);

        const item = options.getString("item", false);
        if (item) return buyItem(member, amount, item);

        return { content: "You must either specify a stock or an item to buy." };
    },
};

async function buyStock(member: GuildMember, quantity: number, stockUser: User): Promise<CommandResponse> {
    const Users = UsersFactory.get(member.guild.id);
    const Stocks = StocksFactory.get(member.guild.id);

    if (quantity <= 0) {
        return { content: "You can only purchase one or more shares." };
    }

    if (!Number.isInteger(quantity)) {
        return { content: "You can only purchase a whole number of stock." };
    }

    if (member.id === stockUser.id) {
        return { content: "You cannot own your own stock." };
    }

    const latestStock = await Stocks.get(stockUser.id);
    if (!latestStock) {
        return { content: "That stock does not exist." };
    }

    const authorBalance: number = await Users.getBalance(member.id);
    let totalBought: number = latestStock.price * quantity > authorBalance
        ? Math.floor(authorBalance / latestStock.price)
        : quantity;
    const totalCost: number = latestStock.price * totalBought;

    if (totalBought === 0) {
        return { content: "You are too poor to purchase any stock." };
    }

    await Users.addStock(member.id, stockUser.id, totalBought);
    await Users.addBalance(member.id, -totalCost);

    const pluralS = quantity > 1 ? "s" : "";
    return new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalBought)} share${pluralS} of ${inlineCode(stockUser.tag)} bought for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)}`,
        value: " ",
    });
}

async function buyItem(member: GuildMember, quantity: number, itemName: string): Promise<CommandResponse> {
    const Users = UsersFactory.get(member.guild.id);
    const Items = ItemsFactory.get(member.guild.id);

    if (!itemName) {
        return { content: "Please specify an item or stock." };
    }

    const item = await Items.get(itemName);
    if (!item) {
        return { content: "That item doesn't exist." };
    }

    if (quantity <= 0) {
        return { content: "You can only purchase one or more items." };
    }

    if (!Number.isInteger(quantity)) {
        return { content: "You can only purchase a whole number of items." };
    }

    const itemCount: number = await Users.getItemCount(member.id);
    const freeInventorySpace = MAX_INV_SIZE - itemCount;

    if (freeInventorySpace <= 0) {
        return { content: `You can only store ${MAX_INV_SIZE} items at a time.` };
    }

    const authorBalance: number = await Users.getBalance(member.id);
    let totalBought: number = item.price * quantity > authorBalance
        ? Math.floor(authorBalance / item.price)
        : quantity;
    totalBought = totalBought > freeInventorySpace ? freeInventorySpace : totalBought;

    if (!totalBought) {
        return { content: "You are too poor to purchase this item." };
    }

    const totalCost: number = item.price * totalBought;
    await Users.addItem(member.id, itemName, totalBought);
    await Users.addBalance(member.id, -totalCost);

    const pluralS = totalBought > 1 ? "s" : "";
    return new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalBought)} ${item.emoji_code} ${item.item_id}${pluralS} bought for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)}`,
        value: " ",
    });
}
