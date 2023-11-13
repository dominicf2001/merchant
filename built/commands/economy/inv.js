"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
const data = {
    command_id: 'inv',
    description: `View your inventory`,
    usage: `${(0, discord_js_1.inlineCode)("$inv")}`,
    cooldown_time: 0,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            const [items, armor, itemCount] = await Promise.all([
                db_objects_1.Users.getItems(message.author.id),
                db_objects_1.Users.getArmor(message.author.id),
                db_objects_1.Users.getItemCount(message.author.id)
            ]);
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setTitle("Inventory")
                .setDescription(`:school_satchel: ${(0, utilities_1.formatNumber)(itemCount)}/5 - - :shield: ${(0, utilities_1.formatNumber)(armor)}/1\n------------------------`);
            const emojiCodes = await Promise.all(items.map(item => db_objects_1.Items.get(item.item_id).then(itemInfo => itemInfo.emoji_code)));
            items.forEach((item, index) => {
                const itemEmojiCode = emojiCodes[index];
                embed.addFields({ name: `${itemEmojiCode} ${item.item_id} - Q. ${(0, utilities_1.formatNumber)(item.quantity)}`, value: ` ` });
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred getting your inventory. Please try again later.');
        }
    }
};
