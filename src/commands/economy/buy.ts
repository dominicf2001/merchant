import {
    UsersFactory,
    ItemsFactory,
    StocksFactory,
} from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    formatNumber,
    findNumericArgs,
    findTextArgs,
    MAX_INV_SIZE,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import {
    Message,
    EmbedBuilder,
    inlineCode,
    SlashCommandBuilder,
} from "discord.js";

const data: Partial<Command> = {
    command_id: "buy" as CommandsCommandId,
    metadata: new SlashCommandBuilder().setName("buy")
      .setDescription("Buy an item or stock")
      .addUserOption(o => o.setName("user").setDescription("the stock to buy"))
      .addStringOption(o => o.setName("item").setDescription("the item to buy"))
      .addNumberOption(o => o.setName("amount").setDescription("the amount to buy")),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        if (message.mentions.users.size === 1) {
            await buyStock(message, args);
        } else {
            await buyItem(message, args);
        }
    },
};

async function buyStock(message: Message, args: string[]): Promise<void> {
    const Users = UsersFactory.get(message.guildId);
    const Stocks = StocksFactory.get(message.guildId);

    const stockUser = message.mentions.users.first();
    const quantity: number = args.includes("all")
        ? 99999
        : +findNumericArgs(args)[0] || 1;

    if (!Number.isInteger(quantity)) {
        throw new Error(`You can only purchase a whole number of shares.`);
    }

    if (quantity <= 0) {
        throw new Error(`You can only purchase one or more shares.`);
    }

    if (message.author.id === stockUser.id) {
        throw new Error(`You cannot own your own stock.`);
    }

    const latestStock = await Stocks.get(stockUser.id);

    if (!latestStock) {
        throw new Error(`That stock does not exist.`);
    }

    const authorBalance: number = await Users.getBalance(message.author.id);
    // buy as many as possible
    const totalBought: number =
        latestStock.price * quantity > authorBalance || args.includes("all")
            ? Math.floor(
                  Math.floor((authorBalance / latestStock.price) * 100) / 100,
              )
            : quantity;
    const totalCost: number = latestStock.price * totalBought;

    await Users.addStock(message.author.id, stockUser.id, totalBought);
    await Users.addBalance(message.author.id, -totalCost);

    const pluralS: string = quantity > 1 ? "s" : "";
    const embed = new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalBought)} share${pluralS} of ${inlineCode(stockUser.tag)} bought for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)}`,
        value: " ",
    });

    await message.reply({ embeds: [embed] });
}

async function buyItem(message: Message, args: string[]): Promise<void> {
    const Users = UsersFactory.get(message.guildId);
    const Items = ItemsFactory.get(message.guildId);

    const itemName: string =
        findTextArgs(args)[0]?.toLowerCase() === "all"
            ? findTextArgs(args)[1]?.toLowerCase()
            : findTextArgs(args)[0]?.toLowerCase();

    const quantity: number = args.includes("all")
        ? 99999
        : +findNumericArgs(args)[0] || 1;

    if (true) {
        await message.reply(
            `Buying items is currently disabled. The economy must stabilize first.`,
        );
        return;
    }

    if (!itemName) {
        throw new Error(`Please specify an item or stock.`);
    }

    const item = await Items.get(itemName);

    if (!item) {
        throw new Error(`That item doesn't exist.`);
    }

    if (!Number.isInteger(quantity)) {
        throw new Error(`You can only purchase a whole number of items.`);
    }

    if (quantity <= 0) {
        throw new Error(`You can only purchase one or more items.`);
    }

    const itemCount: number = await Users.getItemCount(message.author.id);
    const freeInventorySpace = MAX_INV_SIZE - itemCount;

    if (freeInventorySpace <= 0) {
        throw new Error(`You can only store ${MAX_INV_SIZE} items at a time.`);
    }
    // if (user.role < item.role) return message.reply(`Your role is too low to buy this item.`);
    // buy as many as possible
    const authorBalance: number = await Users.getBalance(message.author.id);
    let totalBought: number =
        item.price * quantity > authorBalance || args.includes("all")
            ? Math.floor(Math.floor((authorBalance / item.price) * 100) / 100)
            : quantity;
    // Dont exceed max inventory size
    totalBought =
        totalBought > freeInventorySpace ? freeInventorySpace : totalBought;

    if (!totalBought) {
        throw new Error(`You are too poor to purchase this item.`);
    }

    const totalCost: number = item.price * totalBought;

    await Users.addItem(message.author.id, itemName, totalBought);
    await Users.addBalance(message.author.id, -totalCost);

    const pluralS = totalBought > 1 ? "s" : "";

    const embed = new EmbedBuilder().setColor("Blurple").addFields({
        name: `${formatNumber(totalBought)} ${item.emoji_code} ${item.item_id}${pluralS} bought for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)}`,
        value: " ",
    });
    await message.reply({ embeds: [embed] });
}
