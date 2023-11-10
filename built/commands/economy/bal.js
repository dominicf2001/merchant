"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
module.exports = {
    data: {
        name: 'bal',
        description: 'Check your tendies.'
    },
    async execute(message, args) {
        const authorBalance = await _database_1.Users.getBalance(message.author.id);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .addFields({ value: `${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(authorBalance)}`, name: `Balance` });
        return message.reply({ embeds: [embed] });
    },
};
