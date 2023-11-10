"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const discord_js_1 = require("discord.js");
const DEFAULT_STOCK_PRICE = 125;
const data = {
    command_id: 'createstock',
    description: `Create a stock`,
    cooldown_time: 0,
    is_admin: true
};
exports.default = {
    data: data,
    async execute(message, args) {
        const user = message.mentions.users.first();
        if (!user) {
            await message.reply("Please specify a target.");
            return;
        }
        // TODO: pull or lookup
        if (message.author.id != "608852453315837964") {
            await message.reply("You do not have permission to use this.");
            return;
        }
        try {
            await db_objects_1.Stocks.set(user.id, {
                price: DEFAULT_STOCK_PRICE
            });
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: `Stock has been created.`,
                value: ` `
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error("Error creating stock: ", error);
            await message.reply("Error creating stock.");
        }
    }
};
