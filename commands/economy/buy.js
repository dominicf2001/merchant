const { Users, Items, UserStocks } = require("../../database/dbObjects.js");
const { tendieIconCode, formatNumber } = require("../../utilities.js");
const { getBalance, addBalance, usersCache } = require("../../database/utilities/userUtilities.js");
const { getLatestStock } = require("../../database/utilities/stockUtilities.js");
const { inlineCode, EmbedBuilder } = require('discord.js');
const { Op } = require("sequelize");

module.exports = {
	data: {
        name: 'buy',
        description: `Buy an item or a stock.`,
        usage: `${inlineCode("$buy [item/@user] [quantity/all]")}\n For stocks only $buy will always purchase as many as possible and "$buy all" is available.`
    },
    async execute(message, args) {
        if (message.mentions.users.size == 1){
            const author = usersCache.get(message.author.id);
            if (author.role < 1) throw new Error(`Your role is too low to buy stocks. Minimum role is: ${inlineCode("Fakecel")}`);
            buyStock(message, args);
        } else {
            const itemName = args.find(arg => isNaN(arg));
            const quantity = args.find(arg => !isNaN(arg)) ?? 1;

            if (quantity <= 0){
                return message.reply(`You can only purchase one or more items.`);
            }

            const user = await Users.findOne({ where: { user_id: message.author.id } });
            const item = await Items.findOne({ where: { name: { [Op.like]: itemName } } });

            if (!item) return message.reply(`That item doesn't exist.`);

            if (user.role < item.role) return message.reply(`Your role is too low to buy this item.`);

            const embed = new EmbedBuilder()
                .setColor("Blurple")

            const pluralS = quantity > 1 ? "s" : "";
            if ((item.price * quantity) > getBalance(message.author.id)) {
                return message.reply(`You only have ${tendieIconCode} ${formatNumber(+getBalance(message.author.id))} tendies. ${formatNumber(quantity)} ${item.name}${pluralS} costs ${tendieIconCode} ${formatNumber(item.price * quantity)} tendies.`);
            }

            const items = await user.getItems();

            const totalQuantity = items.reduce((previous, current) => {
                return previous + current["quantity"];
            }, +quantity);

            const maxInventorySize = 5;

            if (totalQuantity > maxInventorySize){
                return message.reply(`You can only store 5 items at a time.`);
            }

            addBalance(message.author.id, -(item.price * quantity));

            for (let i = 0; i < quantity; ++i){
                await user.addItem(item);
            }

            embed.addFields({
                name: `${formatNumber(quantity)} ${item.name}${pluralS} bought for ${tendieIconCode} ${formatNumber(item.price * quantity)}`,
                value: ' '
            });
            return message.reply({ embeds: [embed] });
        }
	},
};

async function buyStock(message, args){
    const stockUser = message.mentions.users.first();
    let shares = args.includes("all") ? 99999 : args.find(arg => !isNaN(arg)) ?? 1;

    if (shares <= 0){
        return message.reply(`You can only purchase one or more shares.`);
    }
    if (message.author.id == stockUser.id){
        return message.reply(`You cannot buy your own stock.`);
    }
    const embed = new EmbedBuilder()
        .setColor("Blurple");

    const latestStock = await getLatestStock(stockUser.id);

    if (!latestStock){
        return message.reply(`That stock does not exist.`);
    }

    const balance = getBalance(message.author.id);
    if ((latestStock.price * shares) > balance || args.includes('all')) {
        shares = Math.floor((balance / latestStock.price) * 100) / 100;
    }

    try {
        addBalance(message.author.id, -(latestStock.price * shares));

        await UserStocks.create({
            user_id: message.author.id,
            stock_user_id: stockUser.id,
            purchase_date: Date.now(),
            shares: shares,
            purchase_price: latestStock.price
        });

        const pluralS = shares > 1 ? "s" : "";

        embed.addFields({
            name: `${formatNumber(shares)} share${pluralS} of ${inlineCode(stockUser.tag)} bought for ${tendieIconCode} ${formatNumber(latestStock.price * shares)}`,
            value: ' '
        });

        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}

