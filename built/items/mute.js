"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const db_objects_1 = require("../database/db-objects");
const utilities_1 = require("../utilities");
const durationMs = utilities_1.MUTE_DURATION_MIN * 60000;
const data = {
    item_id: 'mute',
    price: 2500,
    emoji_code: ":mute:",
    description: `Mutes a user for ${utilities_1.MUTE_DURATION_MIN} minutes`,
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
        if (target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> is already muted.`);
        }
        const targetArmor = await db_objects_1.Users.getArmor(target.id);
        if (targetArmor) {
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
            await target.timeout(durationMs);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: `${(0, discord_js_1.inlineCode)(target.user.username)} has been muted for ${utilities_1.MUTE_DURATION_MIN} minutes`,
                value: ` `
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            throw new Error(`Could not use mute. Please try again.`);
        }
    }
};
