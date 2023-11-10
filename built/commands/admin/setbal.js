"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const discord_js_1 = require("discord.js");
const _utilities_1 = require("@utilities");
module.exports = {
    data: {
        name: 'setbal',
        description: `(ADMIN) Set a users role.\n${(0, discord_js_1.inlineCode)("$setbal @target [role]")}`
    },
    async execute(message, args) {
        const newBalance = +(0, _utilities_1.findNumericArgs)(args)[0];
        const target = message.mentions.users.first() ?? message.author;
        // TODO: pull or lookup
        if (message.author.id != "608852453315837964") {
            await message.reply("You do not have permission to use this.");
            return;
        }
        if (!newBalance) {
            await message.reply("You must specify a balance.");
            return;
        }
        ;
        if (!target) {
            await message.reply("You must specify a target.");
            return;
        }
        _database_1.Users.setBalance(target.id, newBalance);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .setFields({
            name: `${(0, discord_js_1.inlineCode)((0, discord_js_1.userMention)(target.id))}'s balance set to: ${_utilities_1.CURRENCY_EMOJI_CODE} ${newBalance}`,
            value: ` `
        });
        await message.reply({ embeds: [embed] });
    }
};
