"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const utilities_1 = require("../utilities");
const db_objects_1 = require("../database/db-objects");
const data = {
    item_id: 'nametag',
    price: 2000,
    emoji_code: ":label:",
    description: "Sets any user's nickname",
    usage: `${(0, discord_js_1.inlineCode)("$use nametag [@user]")}`
};
exports.default = {
    data: data,
    async use(message, args) {
        const target = message.mentions.members.first();
        const newNickname = (0, utilities_1.findTextArgs)(args).slice(1).join(" ");
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (!target.moderatable) {
            throw new Error('This user is immune to nametags.');
        }
        if (!newNickname.length) {
            throw new Error('Please specify a nickname.');
        }
        if (newNickname.length > 32) {
            throw new Error('This name is too long.');
        }
        const targetArmor = await db_objects_1.Users.getArmor(target.id);
        if (targetArmor && message.author.id !== target.id) {
            await db_objects_1.Users.addArmor(target.id, -1);
            await message.reply('Blocked by `armor`! This user is now exposed.');
            return;
        }
        try {
            await target.setNickname(newNickname);
            await message.reply(`Nickname of <@${target.id}> has been changed to ${newNickname}`);
        }
        catch (error) {
            // TODO: make an explicit permissions check?
            throw new Error("Could not use nametag. Please try again");
        }
    }
};
