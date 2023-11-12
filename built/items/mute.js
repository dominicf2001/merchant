"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
// TODO: should pull from the global json paramter file?
const durationMin = 5;
const durationMs = durationMin * 60000;
const data = {
    item_id: 'mute',
    price: 2500,
    emoji_code: ":mute:",
    description: `Mutes a user for ${durationMin} minutes`,
    usage: `${(0, discord_js_1.inlineCode)("$use mute [@user]")}`
};
exports.default = {
    data: data,
    async use(message, args) {
        let target = message.mentions.members.first();
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> has already been muted.`);
        }
        try {
            target.timeout(durationMs);
            await message.channel.send(`<@${target.id}> has been muted for ${durationMin} minutes.`);
        }
        catch (error) {
            console.error(error);
            await message.channel.send(`<@${target.id}> could not be muted.`);
        }
    }
};
