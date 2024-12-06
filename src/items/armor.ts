import { EmbedBuilder, GuildMember, inlineCode, SlashCommandSubcommandBuilder } from "discord.js";
import { UsersFactory } from "../database/db-objects";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const data: Partial<Item> = {
    item_id: "armor" as ItemsItemId,
    price: 1500,
    emoji_code: ":shield:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("armor")
        .setDescription("Protects against nametag, dye, and mute (Can only apply one at a time)")
};

export default {
    data: data,
    async use(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        try {
            const Users = UsersFactory.get(member.guild.id);

            const authorArmor = await Users.getArmor(member.id);

            if (authorArmor >= 1) {
                throw new Error("You can only apply one armor at a time.");
            }

            await Users.addArmor(member.id, 1);

            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: ":shield: Armor has been applied.",
                value: " ",
            });

            return embed;
        } catch (error) {
            console.error(error);
            throw error;
        }
    },
};
