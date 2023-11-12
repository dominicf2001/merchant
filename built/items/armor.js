"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const db_objects_1 = require("../database/db-objects");
const data = {
    item_id: 'armor',
    price: 750,
    emoji_code: ":shield:",
    description: "Protects against nametag, dye, and mute (Can only apply one at a time)",
    usage: `${(0, discord_js_1.inlineCode)("$use armor")}`
};
exports.default = {
    data: data,
    async use(message, args) {
        try {
            const authorArmor = await db_objects_1.Users.getArmor(message.author.id);
            if (authorArmor >= 1) {
                throw new Error("You can only apply one armor at a time.");
            }
            await db_objects_1.Users.addArmor(message.author.id, 1);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: ":shield: Armor has been applied.",
                value: " "
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
};
