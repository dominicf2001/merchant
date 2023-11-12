"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const data = {
    command_id: 'bal',
    description: `View your balance`,
    usage: `${(0, discord_js_1.inlineCode)("$bal")}`,
    cooldown_time: 0,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        console.log("Execute!");
        const authorBalance = await db_objects_1.Users.getBalance(message.author.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .addFields({ value: `${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(authorBalance)}`, name: `Balance` });
        await message.reply({ embeds: [embed] });
    },
};
