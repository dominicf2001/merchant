"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const stock_utilities_1 = require("../../stock-utilities");
const data = {
    command_id: 'tick',
    description: `Update all stock prices`,
    cooldown_time: 0,
    usage: `${(0, discord_js_1.inlineCode)("$tick")}`,
    is_admin: true
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            await (0, stock_utilities_1.updateStockPrices)();
            await message.reply("Stocks ticked");
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when ticking. Please try again later.');
        }
    }
};
