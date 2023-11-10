"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
const discord_js_1 = require("discord.js");
module.exports = {
    data: {
        name: 'use',
        description: `Use an item.\n${(0, discord_js_1.inlineCode)("$use [item]")}\n${(0, discord_js_1.inlineCode)("$use [item] @target")}`
    },
    async execute(message, args) {
        let itemName = (0, _utilities_1.findTextArgs)(args)[0];
        const item = await _database_1.Users.getItem(message.author.id, itemName);
        if (!item) {
            await message.reply("You do not have this item!");
            return;
        }
        try {
            await _database_1.Users.addItem(message.author.id, itemName, -1);
            await _database_1.Items.use(itemName, message, args);
        }
        catch (error) {
            await message.reply(error.message);
        }
    },
};
