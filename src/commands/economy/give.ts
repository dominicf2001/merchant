const { getBalance, addBalance } = require("../../database/utilities/userUtilities.js");
const { tendieIconCode, formatNumber } = require("../../utilities.js");
const { EmbedBuilder, inlineCode } = require('discord.js');

module.exports = {
	data: {
        name: 'give',
        description: `Share your tendies.\n${inlineCode("$give @target [amount]")}`
    },
	async execute(message, args) {
		const currentAmount = getBalance(message.author.id);
		const transferAmount = args.find(arg => !isNaN(arg));
		const transferTarget = message.mentions.users.first();

        if (!transferTarget){
            throw Error("Please specify a target.");
        }

		if (!transferAmount) return message.reply(`Specify how many tendies, ${message.author.username}.`);
		if (!transferTarget) return message.reply(`Mention the user to whom you want to give tendies, ${message.author.username}.`);
		if (transferAmount > currentAmount) return message.reply(`You only have ${tendieIconCode} ${formatNumber(currentAmount)} tendies.`);
		if (transferAmount <= 0) return message.reply(`Enter an amount greater than zero, ${message.author.username}.`);

        addBalance(message.author.id, -transferAmount);
        addBalance(transferTarget.id, +transferAmount);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: `${tendieIconCode} ${formatNumber(transferAmount)} transferred to: ${inlineCode(transferTarget.username)}`,
                value: `You have ${tendieIconCode} ${formatNumber(+getBalance(message.author.id))} remaining`
            });

        return message.reply({ embeds: [embed] });
    },
}