import { UsersFactory, ItemsFactory } from "../../database/db-objects";
import { CommandOptions, CommandResponse, formatNumber, MAX_INV_SIZE } from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { EmbedBuilder, SlashCommandBuilder, GuildMember } from "discord.js";

const data: Partial<Command> = {
    command_id: "inv" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("inv")
      .setDescription("View your inventory"),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse>  {
        const Users = UsersFactory.get(member.guild.id);
        const Items = ItemsFactory.get(member.guild.id);

        const [items, armor, itemCount] = await Promise.all([
            Users.getItems(member.id),
            Users.getArmor(member.id),
            Users.getItemCount(member.id),
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

        return embed;
    },
};
