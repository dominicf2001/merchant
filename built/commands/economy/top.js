"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
module.exports = {
    data: {
        name: 'top',
        description: 'See who are the goodest boys.'
    },
    async execute(message, args) {
        const allUsers = await _database_1.Users.getAll();
        const netWorths = await Promise.all(allUsers.map(user => _database_1.Users.getNetWorth(user.user_id)));
        const usersAndNetWorths = allUsers.map((user, index) => ({
            user,
            netWorth: netWorths[index],
        }));
        usersAndNetWorths.sort((a, b) => b.netWorth - a.netWorth);
        const topUsers = usersAndNetWorths.slice(0, 10);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Goodest Boys");
        let i = 1;
        for (const userAndNetworth of topUsers) {
            const { user, netWorth } = userAndNetworth;
            embed.addFields({ name: `${i++}. ${(0, discord_js_1.inlineCode)((0, discord_js_1.userMention)(user.user_id))}`, value: `${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(netWorth)}` });
        }
        await message.reply({ embeds: [embed] });
    },
};
