import { Message, inlineCode, EmbedBuilder, GuildMember, SlashCommandSubcommandBuilder } from "discord.js";
import { findTextArgs } from "../utilities";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { UsersFactory } from "../database/db-objects";
import { CommandOptions, CommandResponse } from "src/command-utilities";

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

export default {
    data: data,
    async use(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const newNickname = options.getString("nickname", true);

        const targetUser = options.getUser("target", true);
        const target = await member.guild.members.fetch(targetUser);
        if (!target) {
            throw new Error("Failed to grab that target.");
        }

        if (!target.moderatable) {
            throw new Error("This user is immune to nametags.");
        }

        if (!newNickname.length) {
            throw new Error("Please specify a nickname.");
        }

        if (newNickname.length > 32) {
            throw new Error("This name is too long.");
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor && member.id !== target.id) {
            await Users.addArmor(target.id, -1);
            return new EmbedBuilder().setColor("Blurple").setFields({
                name: `Blocked by :shield: armor!`,
                value: `This user is now exposed`,
            });
        }

        try {
            await target.setNickname(newNickname);

            return new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(target.user.username)}'s nickname has been changed`,
                value: ` `,
            });
        } catch (error) {
            // TODO: make an explicit permissions check?
            throw new Error("Could not use nametag. Please try again");
        }
    },
};
