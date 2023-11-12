"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const data = {
    item_id: 'unmute',
    price: 750,
    emoji_code: ":loud_sound:",
    description: "Unmutes a user",
    usage: `${(0, discord_js_1.inlineCode)("$use unmute [@user]")}`
};
module.exports = {
    data: data,
    async use(message, args) {
        let target = message.mentions.members.first();
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (!target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> has not been muted.`);
        }
        try {
            target.timeout(null);
            await message.channel.send(`<@${target.id}> has been unmuted.`);
        }
        catch (error) {
            throw new Error(`Could not use unmute. Please try again.`);
        }
    }
};
