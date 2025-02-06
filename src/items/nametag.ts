import { inlineCode, EmbedBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { CommandOptions, ItemResponse } from "../utilities";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { UsersFactory } from "../database/db-objects";
import { ItemObj } from "src/database/datastores/Items";

const data: Partial<Item> = {
    item_id: "nametag" as ItemsItemId,
    price: 8000,
    emoji_code: ":label:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("nametag")
        .setDescription("Sets any user's nickname")
        .addUserOption(o => o
            .setName("target")
            .setDescription("the user you want to mute")
            .setRequired(true))
        .addStringOption(o => o
            .setName("nickname")
            .setDescription("the nickname you want to set")
            .setRequired(true))
};

export default <ItemObj>{
    data,
    async use(member: GuildMember, options: CommandOptions): Promise<ItemResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const newNickname = options.getString("nickname", true);

        const targetUser = options.getUser("target", true);
        const target = await member.guild.members.fetch(targetUser);
        if (!target) {
            return { reply: { content: "Failed to grab that target." }, success: false };
        }

        if (!target.moderatable) {
            return { reply: { content: "This user is immune to nametags." }, success: false };
        }

        if (!newNickname.length) {
            return { reply: { content: "Please specify a nickname." }, success: false };
        }

        if (newNickname.length > 32) {
            return { reply: { content: "This name is too long." }, success: false };
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor && member.id !== target.id) {
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
            await target.setNickname(newNickname);

            return {
                reply: new EmbedBuilder().setColor("Blurple").setFields({
                    name: `${inlineCode(target.user.username)}'s nickname has been changed`,
                    value: ` `,
                }),
                success: true
            };
        } catch (error) {
            // TODO: make an explicit permissions check?
            return {
                reply: { content: "Could not use nametag. Please try again" },
                success: false
            };
        }
    },
};
