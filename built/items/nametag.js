"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const utilities_1 = require("../utilities");
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
        const newNickname = (0, utilities_1.findTextArgs)(args).join(" ");
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (!newNickname.length) {
            throw new Error('Please specify a nickname.');
        }
        if (newNickname.length > 32) {
            throw new Error('This name is too long.');
        }
        try {
            await target.setNickname(newNickname);
            message.channel.send(`Nickname of <@${target.id}> has been changed to ${newNickname}`);
        }
        catch (error) {
            // TODO: make an explicit permissions check?
            throw new Error("Cannot use nametag on this user.");
        }
    }
};
