import { Message, inlineCode, EmbedBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { CommandOptions, CommandResponse } from "src/command-utilities";

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

export default {
    data: data,
    async use(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        
        const targetUser = options.getUser("target", true);
        const target = await member.guild.members.fetch(targetUser);
        if (!target) {
            throw new Error("Failed to grab that target.");
        }

        if (!target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> has not been muted.`);
        }

        try {
            await target.timeout(null);
            return new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(target.user.username)} has been unmuted`,
                value: ` `,
            });
        } catch (error) {
            throw new Error(`Could not use unmute. Please try again.`);
        }
    },
};
