const { tendieIconCode } = require("../../utilities.js");
const { setBalance } = require("../../database/utilities/userUtilities.js");
const { EmbedBuilder, inlineCode } = require('discord.js');

module.exports = {
	data: {
        name: 'setbal',
        description: `(ADMIN) Set a users balance.\n${inlineCode("$addbalance @target amount")}`
    },
	async execute(message, args) {
        if (message.author.id != "608852453315837964") {
            return message.reply("You do not have permission to use this.");
        }

		const newBalance = args.find(arg => !isNaN(arg));
		const target = message.mentions.users.first() ?? message.author;

        if (!newBalance) {
            return message.reply("You must specify a balance.");
        };

        if (!target) {
            return message.reply("You must specify a target.");
        }

        setBalance(target.id, newBalance);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: `${inlineCode(target.username)}'s balance set to: ${tendieIconCode} ${newBalance}`,
                value: ` `
            });

        return message.reply({ embeds: [embed] });
    }
}
