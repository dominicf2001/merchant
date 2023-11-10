import { Users } from '@database';
import { Message, EmbedBuilder } from 'discord.js';
import { CURRENCY_EMOJI_CODE, getRandomInt } from '@utilities';

module.exports = {
    cooldown: 3600,
    data: {
        name: 'work',
        description: 'Make some tendies.'
    },
    async execute(message: Message, args: string[]): Promise<void> {
        try {
            const tendiesMade = getRandomInt(100, 500);
            Users.addBalance(message.author.id, tendiesMade);

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
