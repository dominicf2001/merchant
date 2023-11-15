"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const data = {
    command_id: 'top',
    description: `See who are the goodest boys`,
    usage: `${(0, discord_js_1.inlineCode)("$top")}`,
    cooldown_time: 0,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            const allUsers = await db_objects_1.Users.getAll();
            const netWorths = await Promise.all(allUsers.map(user => db_objects_1.Users.getNetWorth(user.user_id)));
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
                const discordUser = await message.client.users.fetch(user.user_id);
                embed.addFields({ name: `${i++}. ${(0, discord_js_1.inlineCode)(discordUser.username)}`, value: `${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(netWorth)}` });
            }
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when getting the top users. Please try again later.');
        }
    }
};
