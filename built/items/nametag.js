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
        const target = message.mentions.members.first() ?? message.member;
        const newNickname = (0, utilities_1.findTextArgs)(args).join(" ");
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
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: `Blocked by :shield: armor!`,
                value: `This user is now exposed`
            });
            await message.reply({ embeds: [embed] });
            return;
        }
        try {
            await target.setNickname(newNickname);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: `${(0, discord_js_1.inlineCode)(target.user.username)}'s nickname has been changed`,
                value: ` `
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            // TODO: make an explicit permissions check?
            throw new Error("Could not use nametag. Please try again");
        }
    }
};
