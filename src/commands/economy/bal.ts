import { Message, EmbedBuilder } from 'discord.js';
import { Users } from '@database';
import { CURRENCY_EMOJI_CODE, formatNumber } from '@utilities';

module.exports = {
	data: {
        name: 'bal',
        description: 'Check your tendies.'
    },
	async execute(message: Message, args: string[]) {
        const authorBalance = await Users.getBalance(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .addFields({ value: `${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)}`, name: `Balance` });

		return message.reply({ embeds: [embed] });
	},
};
