const { EmbedBuilder, inlineCode } = require('discord.js');
const { tendieIconCode } = require("../../utilities.js");
const { setStockPrice } = require("../../database/utilities/stockUtilities.js");

module.exports = {
	data: {
        name: 'setprice',
        description: 'View stocks.'
    },
    async execute(message, args) {
        const id = args[0];
        const newPrice = args[1];

        try {
            setStockPrice(id, newPrice);
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                    name: `${inlineCode(id)}'s price set to: ${tendieIconCode} ${newPrice}`,
                    value: ` `
                });
            return message.reply({ embeds: [embed] });
        } catch(error) {
            console.error("Error setting price: ", error);
        }

    },
};
