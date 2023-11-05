import { Users, Items, Stocks } from '@database';
import { CURRENCY_EMOJI_CODE, formatNumber, findNumericArgs, findTextArgs } from '@utilities';
import { Message, EmbedBuilder, inlineCode } from 'discord.js';

module.exports = {
    data: {
        name: 'buy',
        description: `Buy an item or a stock.`,
        usage: `${inlineCode("$buy [(item) OR @(user)] [(quantity) OR all]")}\n For stocks only $buy will always purchase as many as possible.`
    },
    async execute(message: Message, args: string[]) {
        if (message.mentions.users.size === 1) {
            buyStock(message, args);
        } else {
            buyItem(message, args);
        }
    },
};

// TOOO: combine the functions?

async function buyStock(message: Message, args: string[]): Promise<void> {
    const stockUser = message.mentions.users.first();
    let quantity: number = args.includes("all") ?
        99999 :
        (+findNumericArgs(args)[0] ?? 1);

    if (!Number.isInteger(quantity)) {
        message.reply(`You can only purchase a whole number of shares.`);
        return;
    }

    if (quantity <= 0) {
        message.reply(`You can only purchase one or more shares.`);
        return;
    }

    if (message.author.id === stockUser.id) {
        message.reply(`You cannot buy your own stock.`);
        return;
    }

    const latestStock = await Stocks.getLatestStock(stockUser.id);

    if (!latestStock) {
        message.reply(`That stock does not exist.`);
        return;
    }

    const authorBalance: number = await Users.getBalance(message.author.id);
    const totalCost: number = latestStock.price * quantity;
    if (totalCost > authorBalance || args.includes('all')) {
        quantity = Math.floor((authorBalance / latestStock.price) * 100) / 100;
    }

    try {
        await Users.addBalance(message.author.id, -(totalCost));
        await Users.addStock(message.author.id, stockUser.id, quantity);

        const pluralS = quantity > 1 ? "s" : "";
        const embed = new EmbedBuilder()
            .setColor('Blurple')
            .addFields({
                name: `${formatNumber(quantity)} share${pluralS} of ${inlineCode(stockUser.tag)} bought for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)}`,
                value: ' '
            });

        message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}

async function buyItem(message: Message, args: string[]): Promise<void> {
    const itemName = findTextArgs(args)[0].toLowerCase();
    const quantity = +findNumericArgs(args)[0] ?? 1;

    if (!Number.isInteger(quantity)) {
        message.reply(`You can only purchase a whole number of items.`);
        return;
    }

    if (quantity <= 0) {
        message.reply(`You can only purchase one or more items.`);
        return;
    }

    const item = await Items.get(itemName);

    if (!item) {
        message.reply(`That item doesn't exist.`);
        return;
    }

    // if (user.role < item.role) return message.reply(`Your role is too low to buy this item.`);

    const authorBalance = await Users.getBalance(message.author.id);
    const totalCost = item.price * quantity;

    const pluralS = quantity > 1 ? "s" : "";
    if (totalCost > authorBalance) {
        message.reply(`You only have ${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)} tendies. ${formatNumber(quantity)} ${item.item_id}${pluralS} costs ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)} tendies.`);
        return;
    }

    // TODO: move to json parameter file?
    const maxItemCount = 5;
    const itemCount = await Users.getItemCount(message.author.id);

    if (itemCount >= maxItemCount) {
        message.reply(`You can only store ${maxItemCount} items at a time.`);
        return;
    }

    await Users.addBalance(message.author.id, -(totalCost));
    await Users.addItem(message.author.id, itemName, itemCount);

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .addFields({
            name: `${formatNumber(quantity)} ${item.item_id}${pluralS} bought for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)}`,
            value: ' '
        });
    message.reply({ embeds: [embed] });
}
