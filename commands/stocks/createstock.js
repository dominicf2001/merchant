const { EmbedBuilder } = require('discord.js');
const { Stocks } = require("../../database/dbObjects.js");
const { latestStocksCache } = require("../../database/utilities/stockUtilities.js");

module.exports = {
    data: {
        name: 'createstock',
        description: 'Create a stock.'
    },
    async execute(message, args) {
        const user = message.mentions.users.first();

        if (!user) {
            return message.reply("Please specify a target.");
        }

        if (message.author.id != "608852453315837964") {
            return message.reply("You do not have permission to use this.");
        }

        try {
            const stock = await Stocks.create({
                user_id: user.id,
                price: 125
            });

            latestStocksCache.set(user.id, stock);

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                    name: `Stock has been created.`,
                    value: ` `
                });
            return message.reply({ embeds: [embed] });
        } catch(error) {
            console.error("Error creating stock: ", error);
            return message.reply("Error creating stock.");
        }

    }
};
