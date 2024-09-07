import { EmbedBuilder, Message, inlineCode } from "discord.js";
import { UsersFactory } from "../database/db-objects";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";

const data: Partial<Item> = {
    item_id: "armor" as ItemsItemId,
    price: 5000,
    emoji_code: ":shield:",
    description:
        "Protects against nametag, dye, and mute (Can only apply one at a time)",
    usage: `${inlineCode("$use armor")}`,
};

export default {
    data: data,
    async use(message: Message, args: string[]): Promise<void> {
        try {
            const Users = UsersFactory.get(message.guildId);

            const authorArmor = await Users.getArmor(message.author.id);

            if (authorArmor >= 1) {
                throw new Error("You can only apply one armor at a time.");
            }

            await Users.addArmor(message.author.id, 1);

            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: ":shield: Armor has been applied.",
                value: " ",
            });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
};
