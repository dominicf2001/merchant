import { Users } from '../../database/db-objects';
import { Message, EmbedBuilder, inlineCode } from 'discord.js';
import { CURRENCY_EMOJI_CODE, getRandomInt } from '../../utilities';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';

const data: Command = {
    command_id: 'work' as CommandsCommandId,
    description: `Make some tendies`,
    usage: `${inlineCode("$work")}`,
    cooldown_time: 30000,
    is_admin: false
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        try {
            const tendiesMade = getRandomInt(100, 500);
            await Users.addBalance(message.author.id, tendiesMade);

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .addFields({ value: `You make: ${CURRENCY_EMOJI_CODE} ${tendiesMade} tendies!`, name: ` ` });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await message.reply('There was an error while trying to work!');
        }
    },
}
