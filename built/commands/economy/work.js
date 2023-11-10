"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const discord_js_1 = require("discord.js");
const _utilities_1 = require("@utilities");
module.exports = {
    cooldown: 3600,
    data: {
        name: 'work',
        description: 'Make some tendies.'
    },
    async execute(message, args) {
        try {
            const tendiesMade = (0, _utilities_1.getRandomInt)(100, 500);
            _database_1.Users.addBalance(message.author.id, tendiesMade);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .addFields({ value: `You make: ${_utilities_1.CURRENCY_EMOJI_CODE} ${tendiesMade} tendies!`, name: ` ` });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('There was an error while trying to work!');
        }
    },
};
