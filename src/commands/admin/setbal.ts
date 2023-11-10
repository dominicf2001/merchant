import { Users } from '../../database/db-objects';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { Message, EmbedBuilder, userMention, inlineCode } from 'discord.js';
import { CURRENCY_EMOJI_CODE, findNumericArgs } from '../../utilities';

const data: Command = {
    command_id: 'setbal' as CommandsCommandId,
    description: `(ADMIN) Set a users role.\n${inlineCode("$setbal @target [role]")}`,
    cooldown_time: 0,
    is_admin: true
};

export default {
    data: data,
	async execute(message: Message, args: string[]): Promise<void> {
		const newBalance: number = +findNumericArgs(args)[0];
		const target = message.mentions.users.first() ?? message.author;
        
        // TODO: pull or lookup
        if (message.author.id != "608852453315837964") {
            await message.reply("You do not have permission to use this.");
            return;
        }

        if (!newBalance) {
            await message.reply("You must specify a balance.");
            return;
        };

        if (!target) {
            await message.reply("You must specify a target.");
            return;
        }

        Users.setBalance(target.id, newBalance);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: `${inlineCode(userMention(target.id))}'s balance set to: ${CURRENCY_EMOJI_CODE} ${newBalance}`,
                value: ` `
            });

        await message.reply({ embeds: [embed] });
    }
}
