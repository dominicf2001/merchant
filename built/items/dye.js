"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const utilities_1 = require("../utilities");
const db_objects_1 = require("../database/db-objects");
const data = {
    item_id: 'dye',
    price: 1500,
    emoji_code: ":art:",
    description: "Sets the color of any user's name",
    usage: `${(0, discord_js_1.inlineCode)("$use dye [color] \n----\nView available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable")}`
};
exports.default = {
    data: data,
    async use(message, args) {
        const target = message.mentions.members.first();
        const color = (0, utilities_1.toUpperCaseString)((0, utilities_1.findTextArgs)(args)[1]);
        // TODO: don't take error throwing approach?
        if (!color) {
            throw new Error('Please specify a color.');
        }
        console.log(color);
        console.log(discord_js_1.Colors[color]);
        if (!discord_js_1.Colors[color]) {
            throw new Error('Invalid color.');
        }
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (!target.moderatable) {
            throw new Error('This user is immune to dyes.');
        }
        const targetArmor = await db_objects_1.Users.getArmor(target.id);
        if (targetArmor && message.author.id !== target.id) {
            db_objects_1.Users.addArmor(target.id, -1);
            await message.channel.send('Blocked by `armor`! This user is now exposed.');
            return;
        }
        try {
            const newRoleName = 'color' + target.id;
            let colorRole = (await message.guild.roles.fetch()).find(role => role.name === newRoleName);
            if (!colorRole) {
                colorRole = await message.guild.roles.create({
                    name: newRoleName,
                    color: color,
                    reason: 'Dye item used'
                });
            }
            else {
                await colorRole.setColor(color);
            }
            await target.roles.add(colorRole);
            const highestPosition = message.guild.roles.highest.position;
            await colorRole.setPosition(highestPosition - 1);
            await message.channel.send(`<@${target.id}>'s color has been changed to ${color}`);
        }
        catch (error) {
            console.error(error);
            throw new Error("Could not use dye. Please try again.");
        }
    }
};
