import { Message, inlineCode, EmbedBuilder, AttachmentBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const data: Partial<Item> = {
    item_id: "megaphone" as ItemsItemId,
    price: 4000,
    emoji_code: ":mega:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("megaphone")
        .setDescription("Sends your message and/or attachment as an @everyone")
        .addStringOption(o => o
            .setName("message")
            .setDescription("the message to send")
            .setRequired(true))
        // .addAttachmentOption()
};

export default {
    data: data,
    async use(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        // TODO: fix attachments
        const msgToSend = options.getString("message", true);
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription(msgToSend)
            .setFooter({ text: `Sent by ${member.user.tag}`, iconURL: member.displayAvatarURL() });

        return {
            content: "@everyone",
            embeds: [embed],
        };
    },
};
