"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const discord_js_1 = require("discord.js");
const utilities_1 = require("../../utilities");
const data = {
    command_id: 'setbal',
    description: `Set a users balance`,
    usage: `${(0, discord_js_1.inlineCode)("$setbal [@user] [#amount]")}`,
    cooldown_time: 0,
    is_admin: true
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            const newBalance = +(0, utilities_1.findNumericArgs)(args)[0];
            const target = message.mentions.users.first() ?? message.author;
            if (!newBalance) {
                await message.reply("You must specify a balance.");
                return;
            }
            ;
            if (!target) {
                await message.reply("You must specify a target.");
                return;
            }
            await db_objects_1.Users.setBalance(target.id, newBalance);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: `${(0, discord_js_1.inlineCode)(target.username)}'s balance set to: ${utilities_1.CURRENCY_EMOJI_CODE} ${newBalance}`,
                value: ` `
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when setting this users balance. Please try again later.');
        }
    }
};
