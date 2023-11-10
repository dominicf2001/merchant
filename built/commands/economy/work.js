"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const discord_js_1 = require("discord.js");
const utilities_1 = require("../../utilities");
const data = {
    command_id: 'work',
    description: `Make some tendies.`,
    cooldown_time: 360000,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            const tendiesMade = (0, utilities_1.getRandomInt)(100, 500);
            db_objects_1.Users.addBalance(message.author.id, tendiesMade);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .addFields({ value: `You make: ${utilities_1.CURRENCY_EMOJI_CODE} ${tendiesMade} tendies!`, name: ` ` });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('There was an error while trying to work!');
        }
    },
};
