import { Users, Items, Stocks } from '../../database/db-objects';
import { CURRENCY_EMOJI_CODE, formatNumber, findNumericArgs, findTextArgs } from '../../utilities';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { Message, EmbedBuilder, inlineCode } from 'discord.js';

const data: Command = {
    command_id: 'buy' as CommandsCommandId,
    description: `Buy an item or a stock. ${inlineCode("$buy [(item) OR @(user)] [(quantity) OR all]")}\n For stocks only $buy will always purchase as many as possible`,
    cooldown_time: 0,
    is_admin: false
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        if (message.mentions.users.size === 1) {
            await buyStock(message, args);
        }
        else {
            await buyItem(message, args);
        }
    },
};

async function buyStock(message: Message, args: string[]): Promise<void> {
    const stockUser = message.mentions.users.first();
    const quantity: number = args.includes("all") ?
        99999 :
        (+findNumericArgs(args)[0] ?? 1);

    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only purchase a whole number of shares.`);
        return;
    }

    if (quantity <= 0) {
        await message.reply(`You can only purchase one or more shares.`);
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

    try {
        const authorBalance: number = await Users.getBalance(message.author.id);
        // buy as many as possible
        const totalBought: number = ((latestStock.price * quantity) > authorBalance || args.includes('all')) ?
            Math.floor((authorBalance / latestStock.price) * 100) / 100 :
            quantity;
        const totalCost: number = latestStock.price * totalBought;
        
        await Users.addStock(message.author.id, stockUser.id, totalBought);
        await Users.addBalance(message.author.id, -(totalCost));

        const pluralS: string = quantity > 1 ? "s" : "";
        const embed = new EmbedBuilder()
            .setColor('Blurple')
            .addFields({
                name: `${formatNumber(totalBought)} share${pluralS} of ${inlineCode(stockUser.tag)} bought for ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)}`,
                value: ' '
            });

        await message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}

async function buyItem(message: Message, args: string[]): Promise<void> {
    const itemName: string = findTextArgs(args)[0]?.toLowerCase();
    const quantity: number = args.includes("all") ?
        99999 :
        (+findNumericArgs(args)[0] ?? 1);

    if (!itemName) {
        await message.reply(`Please specify an item or stock.`);
        return;    
    }

    const item = await Items.get(itemName);

    if (!item) {
        await message.reply(`That item doesn't exist.`);
        return;
    }
    
    if (!Number.isInteger(quantity)) {
        await message.reply(`You can only purchase a whole number of items.`);
        return;
    }

    if (quantity <= 0) {
        await message.reply(`You can only purchase one or more items.`);
        return;
    }

    try {
        // if (user.role < item.role) return message.reply(`Your role is too low to buy this item.`);
        const authorBalance: number = await Users.getBalance(message.author.id);
        // buy as many as possible
        const totalBought: number = ((item.price * quantity) > authorBalance || args.includes('all')) ?
            Math.floor((authorBalance / item.price) * 100) / 100 :
            quantity;
        const totalCost: number = item.price * totalBought;

        const pluralS = quantity > 1 ? "s" : "";
        if (totalCost > authorBalance) {
            message.reply(`You only have ${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)} tendies. ${formatNumber(quantity)} ${item.item_id}${pluralS} costs ${CURRENCY_EMOJI_CODE} ${formatNumber(totalCost)} tendies.`);
            return;
        }

        // TODO: move to json parameter file?
        const MAX_ITEM_COUNT: number = 5;
        const itemCount: number = await Users.getItemCount(message.author.id);

        if (itemCount >= MAX_ITEM_COUNT) {
            message.reply(`You can only store ${MAX_ITEM_COUNT} items at a time.`);
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
    catch (error) {
        console.error(error);
    }
}
