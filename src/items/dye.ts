import {
    Message,
    Colors,
    ColorResolvable,
    inlineCode,
    EmbedBuilder,
    GuildMember,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import { findTextArgs, toUpperCaseString } from "../utilities";
import { UsersFactory } from "../database/db-objects";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { CommandOptions, CommandResponse, makeChoices } from "src/command-utilities";

const data: Partial<Item> = {
    item_id: "dye" as ItemsItemId,
    price: 5000,
    emoji_code: ":art:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("dye")
        .setDescription("Sets the color of any user's name")
        .addUserOption(o => o
            .setName("target")
            .setDescription("the target user"))
        .addStringOption(o => o
            .setName("color")
            .setDescription("the color to set")
            .setChoices(makeChoices(...Object.keys(Colors)))
            .setRequired(true)
        )
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
        
        const colorArg = options.getString("color", true);
        const color = toUpperCaseString(colorArg) as ColorResolvable & string;
        if (!Colors[color]) {
            throw new Error("Invalid color.");
        }

        if (!target.moderatable) {
            throw new Error("This user is immune to dyes.");
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
            const newRoleName = "color-" + color;
            let colorRole = (await member.guild.roles.fetch()).find(
                (role) => role.name === newRoleName,
            );
            if (!colorRole) {
                colorRole = await member.guild.roles.create({
                    name: newRoleName,
                    color: color,
                    reason: "Dye item used",
                });
            } else {
                await colorRole.setColor(color);
            }

            await target.roles.add(colorRole);

            const highestPosition = member.guild.roles.highest.position;
            await colorRole.setPosition(highestPosition - 1);

            return new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(target.user.username)}'s color has been changed to ${color}`,
                value: ` `,
            });

        } catch (error) {
            console.error(error);
            throw new Error(
                "An error occurred when using dye. Please try again later.",
            );
        }
    },
};
