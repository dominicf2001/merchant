import { UsersFactory, ItemsFactory } from "../../database/db-objects";
import { formatNumber, MAX_INV_SIZE } from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, EmbedBuilder, SlashCommandBuilder } from "discord.js";

const data: Partial<Command> = {
    command_id: "inv" as CommandsCommandId,
    metadata: new SlashCommandBuilder().setName("inv").setDescription("View your inventory"),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const Users = UsersFactory.get(message.guildId);
        const Items = ItemsFactory.get(message.guildId);

        const [items, armor, itemCount] = await Promise.all([
            Users.getItems(message.author.id),
            Users.getArmor(message.author.id),
            Users.getItemCount(message.author.id),
        ]);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Inventory")
            .setDescription(
                `:school_satchel: ${formatNumber(itemCount)}/${MAX_INV_SIZE} - - :shield: ${formatNumber(armor)}/1\n------------------------`,
            );

        const emojiCodes = await Promise.all(
            items.map((item) =>
                Items.get(item.item_id).then((itemInfo) => itemInfo.emoji_code),
            ),
        );

        items.forEach((item, index) => {
            const itemEmojiCode = emojiCodes[index];
            embed.addFields({
                name: `${itemEmojiCode} ${item.item_id} - Q. ${formatNumber(item.quantity)}`,
                value: ` `,
            });
        });

        await message.reply({ embeds: [embed] });
    },
};
