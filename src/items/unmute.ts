import { Message, inlineCode, EmbedBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { CommandOptions, ItemResponse } from "src/utilities";
import { ItemObj } from "src/database/datastores/Items";

const data: Partial<Item> = {
    item_id: "unmute" as ItemsItemId,
    price: 3000,
    emoji_code: ":loud_sound:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("unmute")
        .setDescription("Unmutes a user")
        .addUserOption(o => o
            .setName("target")
            .setDescription("the user you want to unmute")
            .setRequired(true))
};

export default <ItemObj>{
    data,
    async use(member: GuildMember, options: CommandOptions): Promise<ItemResponse> {

        const targetUser = options.getUser("target", true);
        const target = await member.guild.members.fetch(targetUser);
        if (!target) {
            return { reply: { content: "Failed to grab that target." }, success: false };
        }

        if (!target.isCommunicationDisabled().valueOf()) {
            return { reply: { content: `<@${target.id}> has not been muted.` }, success: false };
        }

        try {
            await target.timeout(null);
            return {
                reply: new EmbedBuilder().setColor("Blurple").setFields({
                    name: `${inlineCode(target.user.username)} has been unmuted`,
                    value: ` `,
                }),
                success: true
            };
        } catch (error) {
            return {
                reply: { content: `Could not use unmute. Please try again.` },
                success: false
            };
        }
    },
};
