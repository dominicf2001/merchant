import { Message, inlineCode, EmbedBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { UsersFactory } from "../database/db-objects";
import { MUTE_DURATION_MIN } from "../utilities";

const durationMs: number = MUTE_DURATION_MIN * 60000;

const data: Partial<Item> = {
    item_id: "mute" as ItemsItemId,
    price: 100000,
    emoji_code: ":mute:",
    description: `Mutes a user for ${MUTE_DURATION_MIN} minutes`,
    usage: `${inlineCode("$use mute [@user]")}`,
};

export default {
    data: data,
    async use(message: Message, args: string): Promise<void> {
        const Users = UsersFactory.get(message.guildId);

        let target = message.mentions.members.first();

        if (!target) {
            throw new Error("Please specify a target.");
        }

        if (!target.moderatable) {
            throw new Error("This user is immune to mutes.");
        }

        if (target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> is already muted.`);
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor) {
            await Users.addArmor(target.id, -1);

            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: `Blocked by :shield: armor!`,
                value: `This user is now exposed`,
            });

            await message.reply({ embeds: [embed] });
            return;
        }

        try {
            await target.timeout(durationMs);
            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(target.user.username)} has been muted for ${MUTE_DURATION_MIN} minutes`,
                value: ` `,
            });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            throw new Error(`Could not use mute. Please try again.`);
        }
    },
};
