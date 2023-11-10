import { Message, EmbedBuilder, inlineCode } from 'discord.js';
import { Users } from '../../database/db-objects';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { CURRENCY_EMOJI_CODE, formatNumber } from '../../utilities';

const data: Command = {
    command_id: 'bal' as CommandsCommandId,
    description: `View your balance.\n${inlineCode("$bal")}`,
    cooldown_time: 0,
    is_admin: false
};

export default {
	data: data,
	async execute(message: Message, args: string[]): Promise<void> {
        console.log("Execute!");
        const authorBalance = await Users.getBalance(message.author.id);
        
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .addFields({ value: `${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)}`, name: `Balance` });

		await message.reply({ embeds: [embed] });
	},
};
