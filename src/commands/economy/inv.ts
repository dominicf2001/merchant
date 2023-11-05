import { Users, Items } from '@database';
import { formatNumber } from '@utilities';
import { Message, EmbedBuilder } from 'discord.js';

module.exports = {
    data: {
        name: 'inv',
        description: 'View your inventory.'
    },
    async execute(message: Message, args: string[]): Promise<void> {
        const [items, armor, itemCount] = await Promise.all([
            Users.getItems(message.author.id),
            Users.getArmor(message.author.id),
            Users.getItemCount(message.author.id)
        ]);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Inventory")
            .setDescription(`:school_satchel: ${formatNumber(itemCount)}/5 - - :shield: ${formatNumber(armor)}/1\n------------------------`);
        
        const emojiCodes = await Promise.all(items.map(item => Items.get(item.item_id).then(itemInfo => itemInfo.emoji_code)));
        
        items.forEach((item, index) => {
            const itemEmojiCode = emojiCodes[index];
            embed.addFields({ name: `${itemEmojiCode} ${item.item_id} - Q. ${formatNumber(item.quantity)}`, value: ` ` });
        });

        message.reply({ embeds: [embed] });
    },
}

