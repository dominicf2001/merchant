import { EmbedBuilder, GuildMember, inlineCode, SlashCommandSubcommandBuilder } from "discord.js";
import { UsersFactory } from "../database/db-objects";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { CommandOptions, CommandResponse, ItemResponse } from "src/utilities";
import { ItemObj } from "src/database/datastores/Items";

const data: Partial<Item> = {
    item_id: "armor" as ItemsItemId,
    price: 1500,
    emoji_code: ":shield:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("armor")
        .setDescription("Protects against nametag, dye, and mute (Can only apply one at a time)")
};

export default <ItemObj>{
    data,
    async use(member: GuildMember, _: CommandOptions): Promise<ItemResponse> {
        try {
            const Users = UsersFactory.get(member.guild.id);

            const authorArmor = await Users.getArmor(member.id);

            if (authorArmor >= 1) {
                return { reply: { content: "You can only apply one armor at a time." }, success: false };
            }

            await Users.addArmor(member.id, 1);

            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: ":shield: Armor has been applied.",
                value: " ",
            });

            return { reply: embed, success: true };
        } catch (error) {
            console.error(error);
        }
    },
};
