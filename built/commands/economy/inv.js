"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _database_1 = require("@database");
const _utilities_1 = require("@utilities");
const discord_js_1 = require("discord.js");
module.exports = {
    data: {
        name: 'inv',
        description: 'View your inventory.'
    },
    async execute(message, args) {
        const [items, armor, itemCount] = await Promise.all([
            _database_1.Users.getItems(message.author.id),
            _database_1.Users.getArmor(message.author.id),
            _database_1.Users.getItemCount(message.author.id)
        ]);
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Inventory")
            .setDescription(`:school_satchel: ${(0, _utilities_1.formatNumber)(itemCount)}/5 - - :shield: ${(0, _utilities_1.formatNumber)(armor)}/1\n------------------------`);
        const emojiCodes = await Promise.all(items.map(item => _database_1.Items.get(item.item_id).then(itemInfo => itemInfo.emoji_code)));
        items.forEach((item, index) => {
            const itemEmojiCode = emojiCodes[index];
            embed.addFields({ name: `${itemEmojiCode} ${item.item_id} - Q. ${(0, _utilities_1.formatNumber)(item.quantity)}`, value: ` ` });
        });
        message.reply({ embeds: [embed] });
    },
};
