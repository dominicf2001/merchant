"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
const data = {
    command_id: 'give',
    description: `Share your tendies`,
    usage: `${(0, discord_js_1.inlineCode)("$give [@user] [#amount]")}`,
    cooldown_time: 0,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            const target = message.mentions.users.first();
            if (!target) {
                await message.reply("Please specify a target.");
                return;
            }
            let authorBalance = await db_objects_1.Users.getBalance(message.author.id);
            const transferAmount = +(0, utilities_1.findNumericArgs)(args)[0];
            if (!transferAmount || transferAmount <= 0) {
                await message.reply(`Specify more than zero tendies.`);
                return;
            }
            if (!Number.isInteger(transferAmount)) {
                await message.reply(`You can only give a whole number of tendies.`);
                return;
            }
            if (transferAmount > authorBalance) {
                await message.reply(`You only have ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(authorBalance)} tendies.`);
                return;
            }
            await db_objects_1.Users.addBalance(message.author.id, -transferAmount);
            authorBalance -= transferAmount;
            await db_objects_1.Users.addBalance(target.id, +transferAmount);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: `${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(transferAmount)} transferred to: ${(0, discord_js_1.inlineCode)(target.username)}`,
                value: `You have ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(authorBalance)} remaining`
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when giving. Please try again later.');
        }
    }
};
