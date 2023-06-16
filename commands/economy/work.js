const { EmbedBuilder } = require('discord.js');
const { tendieIconCode, getRandomInt } = require("../../utilities.js");
const { addBalance } = require("../../database/utilities/userUtilities.js");

module.exports = {
    cooldown: 86400,
	data: {
        name: 'work',
        description: 'Make some tendies.'
    },
	async execute(message, args) {
        try {
            const tendiesMade = getRandomInt(40, 101);
            addBalance(message.author.id, tendiesMade);

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .addFields({ value: `You make: ${tendieIconCode} ${tendiesMade} tendies!`, name: ` ` });

		return message.reply({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            await message.reply('There was an error while trying to work!');
        }
    },
}
