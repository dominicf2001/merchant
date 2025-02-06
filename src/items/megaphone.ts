import { Message, inlineCode, EmbedBuilder, AttachmentBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { CommandOptions, ItemResponse } from "src/utilities";
import { ItemObj } from "src/database/datastores/Items";

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

export default <ItemObj>{
    data,
    async use(member: GuildMember, options: CommandOptions): Promise<ItemResponse> {
        // TODO: fix attachments
        const msgToSend = options.getString("message", true);
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription(msgToSend)
            .setFooter({ text: `Sent by ${member.user.tag}`, iconURL: member.displayAvatarURL() });

        return {
            reply: {
                content: "@everyone",
                embeds: [embed],
            },
            success: true
        };
    },
};
