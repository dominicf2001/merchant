const { getBalance, addBalance } = require("../../database/utilities/userUtilities.js");
const { tendieIconCode, formatNumber, getRandomInt, getRandomFloat } = require("../../utilities.js");
const { EmbedBuilder, inlineCode } = require('discord.js');

module.exports = {
	data: {
        name: 'rob',
        cooldown: 7200,
        description: `Rob a user of their tendies. Chance to fail and lose tendies.\n${inlineCode("$rob @target")}`
    },
	async execute(message, args) {
		const target = message.mentions.users.first();

        if (!target){
            return message.reply("Please specify a target.");
        }

        const amount = getBalance(target.id) * getRandomFloat(.01, .10);

        let reply = "";
        if (getRandomInt(1,100) > 70){
            addBalance(message.author.id, +amount);
            addBalance(target.id, -amount);
            reply = `You have robbed ${tendieIconCode} ${formatNumber(amount)} from: ${inlineCode(target.username)}.`;
        } else {
            addBalance(message.author.id, -amount);
            reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${tendieIconCode} ${formatNumber(amount)} `;
        }

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: reply,
                value: ` `
            });

        return message.reply({ embeds: [embed] });
    },
}
