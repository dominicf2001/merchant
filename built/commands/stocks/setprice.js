"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const discord_js_1 = require("discord.js");
const utilities_1 = require("../../utilities");
const data = {
    command_id: 'setprice',
    description: `Set a stock price`,
    usage: `${(0, discord_js_1.inlineCode)("$setprice [@user] [#amount]")}`,
    cooldown_time: 0,
    is_admin: true
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            const stockUser = message.mentions.members.first();
            const newPrice = +(0, utilities_1.findNumericArgs)(args);
            if (!newPrice) {
                await message.reply("Please specify a price.");
                return;
            }
            await db_objects_1.Stocks.updateStockPrice(stockUser.id, newPrice);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: `${(0, discord_js_1.inlineCode)((0, discord_js_1.userMention)(stockUser.id))}'s price set to: ${utilities_1.CURRENCY_EMOJI_CODE} ${newPrice}`,
                value: ` `
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when setting the stock price. Please try again later.');
        }
    },
};
