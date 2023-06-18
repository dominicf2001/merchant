const { usersCache } = require("../../database/utilities/userUtilities.js");
const { EmbedBuilder, inlineCode } = require('discord.js');
const { tendieIconCode, formatNumber } = require("../../utilities.js");

module.exports = {
	data: {
        name: 'top',
        description: 'See who are the goodest boys.'
    },
    async execute(message) {
        const topUsers = usersCache.sort((a, b) => b.balance - a.balance).first(10);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Goodest Boys");

        await Promise.all(topUsers.map(async (user, index) => {
            const fetchedUser = await message.client.users.fetch(user.user_id);
            embed.addFields({ name: `${index + 1}. ${inlineCode(fetchedUser.tag)}`, value: `${tendieIconCode} ${formatNumber(user.balance)}`});
        }));

        return message.reply({ embeds: [embed] });
    },
}
