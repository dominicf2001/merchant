import { Message, EmbedBuilder, inlineCode, userMention } from 'discord.js';
import { Users } from '@database';
import { CURRENCY_EMOJI_CODE, formatNumber } from '@utilities';

module.exports = {
    data: {
        name: 'top',
        description: 'See who are the goodest boys.'
    },
    async execute(message: Message, args: string[]): Promise<void> {
        const allUsers = await Users.getAll();
        
        const netWorths = await Promise.all(allUsers.map(user => Users.getNetWorth(user.user_id)));
        
        const usersAndNetWorths = allUsers.map((user, index) => ({
            user,
            netWorth: netWorths[index],
        }));
        usersAndNetWorths.sort((a, b) => b.netWorth - a.netWorth);
        
        const topUsers = usersAndNetWorths.slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Goodest Boys");

        let i = 1;
        for (const userAndNetworth of topUsers) {
            const { user, netWorth } = userAndNetworth;
            embed.addFields({ name: `${i++}. ${inlineCode(userMention(user.user_id))}`, value: `${CURRENCY_EMOJI_CODE} ${formatNumber(netWorth)}` });
        }

        await message.reply({ embeds: [embed] });
    },
};
