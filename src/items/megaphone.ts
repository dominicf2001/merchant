import { Message, inlineCode, EmbedBuilder, AttachmentBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";

const data: Partial<Item> = {
    item_id: "megaphone" as ItemsItemId,
    price: 100000,
    emoji_code: ":mega:",
    description: "Sends your message and/or attachment as an @everyone",
    usage: `${inlineCode("$use megaphone [message/attachment]")}\n${inlineCode("$use megaphone [message] [attachment]")}`,
};

export default {
    data: data,
    async use(message: Message, args: string[]): Promise<void> {
        // TODO: fix attachments
        const msgToSend = args.join(" ");

        if (!msgToSend) {
            throw new Error("You must provide a message.");
        }

        await message.delete();

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setDescription(msgToSend)
            .setFooter({ text: `Sent by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

        await message.channel.send({
            content: "@everyone",
            embeds: [embed],
        });
    },
};
