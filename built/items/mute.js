"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const db_objects_1 = require("../database/db-objects");
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
        if (!target.moderatable) {
            throw new Error('This user is immune to mutes.');
        }
        const targetArmor = await db_objects_1.Users.getArmor(target.id);
        if (targetArmor) {
            db_objects_1.Users.addArmor(target.id, -1);
            throw new Error('Blocked by `armor`!. This user is now exposed.');
        }
        if (target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> is already muted.`);
        }
        try {
            await target.timeout(durationMs);
            await message.channel.send(`<@${target.id}> has been muted for ${durationMin} minutes.`);
        }
        catch (error) {
            console.error(error);
            throw new Error(`<@${target.id}> could not be muted. Please try again.`);
        }
    }
};
