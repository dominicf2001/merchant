"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
const data = {
    command_id: 'use',
    description: `Use an item`,
    usage: `${(0, discord_js_1.inlineCode)("$use [item]")}\n${(0, discord_js_1.inlineCode)("$use [item] [@user]")}`,
    cooldown_time: 0,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        let itemName = (0, utilities_1.findTextArgs)(args)[0];
        if (!itemName) {
            await message.reply("Please specifiy an item.");
            return;
        }
        const item = await db_objects_1.Users.getItem(message.author.id, itemName);
        if (!item) {
            await message.reply("You do not have this item!");
            return;
        }
        try {
            await db_objects_1.Items.use(itemName, message, args);
            await db_objects_1.Users.addItem(message.author.id, itemName, -1);
        }
        catch (error) {
            await message.reply(error.message);
        }
    },
};
