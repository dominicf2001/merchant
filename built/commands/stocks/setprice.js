"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const discord_js_1 = require("discord.js");
const utilities_1 = require("../../utilities");
module.exports = {
    data: {
        name: 'setprice',
        description: 'View stocks.'
    },
    async execute(message, args) {
        const stockUser = message.mentions.members.first();
        const newPrice = +(0, utilities_1.findNumericArgs)(args);
        if (!newPrice) {
            await message.reply("Please specify a price.");
            return;
        }
        if (message.author.id != "608852453315837964") {
            await message.reply("You do not have permission to use this.");
            return;
        }
        try {
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
            console.error("Error setting price: ", error);
            await message.reply("Error setting price.");
        }
    },
};
