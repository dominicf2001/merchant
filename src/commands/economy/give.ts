import { Users } from '@database';
import { findNumericArgs, CURRENCY_EMOJI_CODE, formatNumber } from '@utilities';
import { Message, EmbedBuilder, inlineCode } from 'discord.js';

module.exports = {
	data: {
        name: 'give',
        description: `Share your tendies.\n${inlineCode("$give @target [(amount)]")}`
    },
	async execute(message: Message, args: string[]): Promise<void> {
		const target = message.mentions.users.first();

        if (!target){
            message.reply("Please specify a target.");
            return;
        }

        let authorBalance: number = await Users.getBalance(message.author.id);
        const transferAmount: number = +findNumericArgs(args)[0];

		if (!transferAmount) {
            message.reply(`Specify how many tendies, ${message.author.username}.`);
            return;
        }

        if (!Number.isInteger(transferAmount)) {
            message.reply(`You can only give a whole number of tendies.`);
            return;
        }

		if (transferAmount > authorBalance) {
            message.reply(`You only have ${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)} tendies.`);
            return;
        }
		if (transferAmount <= 0) {
            message.reply(`Enter an amount greater than zero, ${message.author.username}.`);
            return;
        }

        await Users.addBalance(message.author.id, -transferAmount);
        authorBalance -= transferAmount;
        await Users.addBalance(target.id, +transferAmount);
        
        
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: `${CURRENCY_EMOJI_CODE} ${formatNumber(transferAmount)} transferred to: ${inlineCode(target.username)}`,
                value: `You have ${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)} remaining`
            });

        message.reply({ embeds: [embed] });
    },
}
