"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
module.exports = {
    data: {
        name: 'use',
        description: `Use an item.\n${(0, discord_js_1.inlineCode)("$use [item]")}\n${(0, discord_js_1.inlineCode)("$use [item] @target")}`
    },
    async execute(message, args) {
        let itemName = (0, utilities_1.findTextArgs)(args)[0];
        const item = await db_objects_1.Users.getItem(message.author.id, itemName);
        if (!item) {
            await message.reply("You do not have this item!");
            return;
        }
        try {
            await db_objects_1.Users.addItem(message.author.id, itemName, -1);
            await db_objects_1.Items.use(itemName, message, args);
        }
        catch (error) {
            await message.reply(error.message);
        }
    },
};
