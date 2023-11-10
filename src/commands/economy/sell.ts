import { Users, Items, Stocks } from '@database';
import { CURRENCY_EMOJI_CODE, formatNumber, findNumericArgs, findTextArgs } from '@utilities';
import { Message, EmbedBuilder, inlineCode } from 'discord.js';

module.exports = {
    data: {
        name: 'sell',
        description: `sell an item or a stock.\n${inlineCode("$sell [item/@user] [quantity/all]")}`
    },
    async execute(message: Message, args: string[]): Promise<void> {
        if (message.mentions.users.size == 1) {
            await sellStock(message, args);
        }
        else {
            await sellItem(message, args);
        }

    }
};

async function sellStock(message: Message, args: string[]): Promise<void> {
    const stockUser = message.mentions.users.first();
    const quantity: number = args.includes("all") ?
        99999 :
        (+findNumericArgs(args)[0] ?? 1);

    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only sell a whole number of shares.`);
        return;
    }

    if (quantity <= 0) {
        await message.reply(`You can only sell one or more shares.`);
        return;
    }

    if (message.author.id === stockUser.id) {
        await message.reply(`You cannot own your own stock.`);
        return;
    }

    const latestStock = await Stocks.getLatestStock(stockUser.id);

    if (!latestStock) {
        await message.reply(`That stock does not exist.`);
        return;
    }

    let userStocks = await Users.getUserStocks(message.author.id, stockUser.id);

    if (!userStocks.length) {
        await message.reply(`You do not own any shares of this stock.`);
        return;
    }

    try {
        const totalSold: number = await Users.addStock(message.author.id, stockUser.id, -quantity);
        const totalReturn: number = latestStock.price * totalSold;

        await Users.addBalance(message.author.id, totalReturn);

        const pluralS: string = totalSold > 1 ? "s" : "";
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .addFields({
                name: `${formatNumber(totalSold)} share${pluralS} of ${inlineCode(stockUser.tag)} sold for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalReturn)}`,
                value: ' '
            });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}

async function sellItem(message: Message, args: string[]): Promise<void> {
    const itemName: string = findTextArgs(args)[0].toLowerCase();
    const quantity: number = args.includes("all") ?
        99999 :
        (+findNumericArgs(args)[0] ?? 1);
    
    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only sell a whole number of items.`);
        return;
    }

    if (quantity <= 0) {
        await message.reply(`You can only sell one or more items.`);
        return;
    }

    const item = await Items.get(itemName);

    if (!item) {
        await message.reply(`That item does not exist.`);
        return;
    }
    
    const userItem = await Users.getItem(message.author.id, itemName);

    if (!userItem) {
        await message.reply(`You do not have this item.`);
        return;
    }
    
    try {
        const totalSold: number = await Users.addItem(message.author.id, itemName, -quantity);
        const totalReturn: number = item.price * totalSold;

        await Users.addBalance(message.author.id, totalReturn);
        
        const pluralS: string = quantity > 1 ? "s" : "";
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .addFields({
                name: `${formatNumber(totalSold)} ${itemName}${pluralS} sold for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalReturn)}`,
                value: ' '
            });
        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}
