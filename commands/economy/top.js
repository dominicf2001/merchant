const { usersCache } = require("../../database/utilities/userUtilities.js");
const { EmbedBuilder, inlineCode } = require('discord.js');
const { tendieIconCode, formatNumber } = require("../../utilities.js");
const { getNetWorth } = require("../../database/utilities/userUtilities.js");

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

        const fetchedUsers = await Promise.all(topUsers.map(user => message.client.users.fetch(user.user_id)));
        const netWorths = await Promise.all(topUsers.map(user => getNetWorth(user.user_id)));

        for (let index = 0; index < topUsers.length; index++) {
            const fetchedUser = fetchedUsers[index];
            const netWorth = netWorths[index];
            embed.addFields({ name: `${index + 1}. ${inlineCode(fetchedUser.tag)}`, value: `${tendieIconCode} ${formatNumber(netWorth)}`});
        }


        return message.reply({ embeds: [embed] });
    },
}
