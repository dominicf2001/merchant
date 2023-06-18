const { getBalance } = require("../../database/utilities/userUtilities.js");
const { EmbedBuilder } = require('discord.js');
const { tendieIconCode, formatNumber } = require("../../utilities.js");

module.exports = {
	data: {
        name: 'bal',
        description: 'Check your tendies.'
    },
	async execute(message, args) {

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .addFields({ value: `${tendieIconCode} ${formatNumber(+getBalance(message.author.id))}`, name: `Balance` });

		return message.reply({ embeds: [embed] });
	},
};
