import { Message, inlineCode, EmbedBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { UsersFactory } from "../database/db-objects";
import { MUTE_DURATION_MIN } from "../utilities";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const durationMs: number = MUTE_DURATION_MIN * 60000;

const data: Partial<Item> = {
    item_id: "mute" as ItemsItemId,
    price: 10000,
    emoji_code: ":mute:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("mute")
        .setDescription(`Mutes a user for ${MUTE_DURATION_MIN} minutes`)
        .addUserOption(o => o
            .setName("target")
            .setDescription("the user you want to mute")
            .setRequired(true))
};

export default {
    data: data,
    async use(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const targetUser = options.getUser("target", true);
        const target = await member.guild.members.fetch(targetUser);
        if (!target) {
            throw new Error("Failed to grab that target.");
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

            return new EmbedBuilder().setColor("Blurple").setFields({
                name: `Blocked by :shield: armor!`,
                value: `This user is now exposed`,
            });
        }

        try {
            await target.timeout(durationMs);
            return new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(target.user.username)} has been muted for ${MUTE_DURATION_MIN} minutes`,
                value: ` `,
            });
        } catch (error) {
            console.error(error);
            throw new Error(`Could not use mute. Please try again.`);
        }
    },
};
