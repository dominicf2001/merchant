const { Users, UserStocks, Stocks } = require("../../database/dbObjects.js");
const { tendieIconCode, formatNumber } = require("../../utilities.js");
const { getBalance, addBalance } = require("../../database/utilities/userUtilities.js");
const { getLatestStock } = require("../../database/utilities/stockUtilities.js");
const { inlineCode, EmbedBuilder } = require('discord.js');
const { Sequelize } = require("sequelize");
const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: './database/database.sqlite'
});

module.exports = {
	data: {
        name: 'sell',
        description: `sell an item or a stock.\n${inlineCode("$sell [item/@user] [quantity/all]")}`
    },
    async execute(message, args) {
        if (message.mentions.users.size == 1){
            sellStock(message, args);
        } else {
            const itemName = args.find(arg => isNaN(arg));
            let quantity = args.find(arg => !isNaN(arg)) ?? 1;
            const user = await Users.findOne({ where: { user_id: message.author.id } });
            const item = await user.getItem(itemName);

            if (!item) return message.reply(`You do not have this item.`);

            if (quantity <= 0){
                return message.reply(`You can only sell one or more items.`);
            }

            if (quantity > item.quantity || args.includes("all")){
                quantity = item.quantity;
            }

            const embed = new EmbedBuilder()
                .setColor("Blurple")

            const pluralS = quantity > 1 ? "s" : "";

            addBalance(message.author.id, item.item.price * quantity);

            for (let i = 0; i < quantity; ++i){
                await user.removeItem(item.item);
            }

            embed.addFields({
                name: `${formatNumber(quantity)} ${item.item.name}${pluralS} sold for ${tendieIconCode} ${formatNumber(item.item.price * quantity)}`,
                value: ' '
            });
            return message.reply({ embeds: [embed] });
        }
	},
};

async function sellStock(message, args) {
    const stockUser = message.mentions.users.first();
    const latestStock = await getLatestStock(stockUser.id);

    try {
        let userStocks = await UserStocks.findAll({
            where: { user_id: message.author.id, stock_user_id: stockUser.id },
            order: [['purchase_date', 'ASC']],
        });

        if (!userStocks.length) throw new Error(`You do not have any shares of this stock.`);

        let shares = args.includes("all") ? 99999 : args.find(arg => !isNaN(arg)) ?? 1;

        if (shares <= 0) {
            throw new Error(`You can only sell one or more stocks.`);
        }

        // sell as many as possible
        let totalSharesSold = 0;
        for (let i = 0; i < userStocks.length; i++) {
            if (shares <= 0) break;

            let userStock = userStocks[i];

            if (Number(userStock.shares) > shares) {
                totalSharesSold += shares;
                userStock.shares -= shares;
                shares = 0;
                await userStock.save();
            } else {
                totalSharesSold += Number(userStock.shares);
                shares -= Number(userStock.shares);

                await userStock.destroy();
            }
        }

        await addBalance(message.author.id, Number(latestStock.price * totalSharesSold));

        const pluralS = totalSharesSold > 1 ? "s" : "";

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .addFields({
                name: `${formatNumber(totalSharesSold)} share${pluralS} of ${inlineCode(stockUser.tag)} sold for ${tendieIconCode} ${formatNumber(latestStock.price * totalSharesSold)}`,
                value: ' '
            });

        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}

