import { Message, inlineCode, EmbedBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";

const data: Item = {
    item_id: "unmute" as ItemsItemId,
    price: 1000,
    emoji_code: ":loud_sound:",
    description: "Unmutes a user",
    usage: `${inlineCode("$use unmute [@user]")}`,
};

module.exports = {
    data: data,
    async use(message: Message, args: string[]): Promise<void> {
        let target = message.mentions.members.first();

        if (!target) {
            throw new Error("Please specify a target.");
        }

        if (!target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> has not been muted.`);
        }

        try {
            await target.timeout(null);
            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(target.user.username)} has been unmuted`,
                value: ` `,
            });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            throw new Error(`Could not use unmute. Please try again.`);
        }
    },
};
