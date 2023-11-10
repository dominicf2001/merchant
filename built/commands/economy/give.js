"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
const discord_js_1 = require("discord.js");
module.exports = {
    data: {
        name: 'give',
        description: `Share your tendies.\n${(0, discord_js_1.inlineCode)("$give @target [(amount)]")}`
    },
    async execute(message, args) {
        const target = message.mentions.users.first();
        if (!target) {
            message.reply("Please specify a target.");
            return;
        }
        let authorBalance = await _database_1.Users.getBalance(message.author.id);
        const transferAmount = +(0, _utilities_1.findNumericArgs)(args)[0];
        if (!transferAmount) {
            message.reply(`Specify how many tendies, ${message.author.username}.`);
            return;
        }
        if (!Number.isInteger(transferAmount)) {
            message.reply(`You can only give a whole number of tendies.`);
            return;
        }
        if (transferAmount > authorBalance) {
            message.reply(`You only have ${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(authorBalance)} tendies.`);
            return;
        }
        if (transferAmount <= 0) {
            message.reply(`Enter an amount greater than zero, ${message.author.username}.`);
            return;
        }
        await _database_1.Users.addBalance(message.author.id, -transferAmount);
        authorBalance -= transferAmount;
        await _database_1.Users.addBalance(target.id, +transferAmount);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .setFields({
            name: `${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(transferAmount)} transferred to: ${(0, discord_js_1.inlineCode)(target.username)}`,
            value: `You have ${_utilities_1.CURRENCY_EMOJI_CODE} ${(0, _utilities_1.formatNumber)(authorBalance)} remaining`
        });
        message.reply({ embeds: [embed] });
    },
};
