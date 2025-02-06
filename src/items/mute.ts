import { Message, inlineCode, EmbedBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { UsersFactory } from "../database/db-objects";
import { ItemResponse, CommandOptions, MUTE_DURATION_MIN } from "../utilities";
import { ItemObj } from "src/database/datastores/Items";

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

export default <ItemObj>{
    data,
    async use(member: GuildMember, options: CommandOptions): Promise<ItemResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const targetUser = options.getUser("target", true);
        const target = await member.guild.members.fetch(targetUser);
        if (!target) {
            return { reply: { content: "Failed to grab that target." }, success: false };
        }

        if (!target.moderatable) {
            return { reply: { content: "This user is immune to mutes." }, success: false };
        }

        if (target.isCommunicationDisabled().valueOf()) {
            return { reply: { content: `<@${target.id}> is already muted.` }, success: false };
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor) {
            await Users.addArmor(target.id, -1);

            return {
                reply: new EmbedBuilder().setColor("Blurple").setFields({
                    name: `Blocked by :shield: armor!`,
                    value: `This user is now exposed`,
                }),
                success: true
            };
        }

        try {
            await target.timeout(durationMs);
            return {
                reply: new EmbedBuilder().setColor("Blurple").setFields({
                    name: `${inlineCode(target.user.username)} has been muted for ${MUTE_DURATION_MIN} minutes`,
                    value: ` `,
                }),
                success: true
            };
        } catch (error) {
            console.error(error);
            return {
                reply: { content: `Could not use mute. Please try again.` },
                success: false
            }
        }
    },
};
