"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const utilities_1 = require("../utilities");
const db_objects_1 = require("../database/db-objects");
module.exports = {
    data: {
        name: 'dye',
        description: "Sets the color of any user's nickname.",
        price: 1500,
        icon: ":art:",
        usage: `$use dye [color] @user\n----\nView available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable.`,
        role: 1
    },
    async use(message, args) {
        const target = message.mentions.members.first();
        const color = (0, utilities_1.toUpperCaseString)((0, utilities_1.findTextArgs)(args)[0]);
        // TODO: don't take error throwing approach?
        if (!color) {
            throw new Error('Please specify a color.');
        }
        if (!discord_js_1.Colors[color]) {
            throw new Error('Invalid color.');
        }
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (message.author.id !== target.id) {
            await db_objects_1.Users.addArmor(target.id, -1);
            await message.reply("This user was protected by :shield: armor. It is now broken and they are exposed.");
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
            message.channel.send(`<@${target.id}>'s color has been changed to ${color}`);
        }
        catch (error) {
            console.error(error);
            throw new Error("Something went wrong when setting the color.");
        }
    }
};
