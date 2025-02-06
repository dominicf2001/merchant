import {
    Message,
    Colors,
    ColorResolvable,
    inlineCode,
    EmbedBuilder,
    GuildMember,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import { toUpperCaseString, CommandOptions, ItemResponse, makeChoices } from "../utilities";
import { UsersFactory } from "../database/db-objects";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";
import { ItemObj } from "src/database/datastores/Items";

const data: Partial<Item> = {
    item_id: "dye" as ItemsItemId,
    price: 5000,
    emoji_code: ":art:",
    metadata: new SlashCommandSubcommandBuilder()
        .setName("dye")
        .setDescription("Sets the color of any user's name")
        .addStringOption(o => o
            .setName("color")
            .setDescription("the color to set")
            .addChoices(makeChoices(...Object.keys(Colors).slice(0, 25)))
            .setRequired(true))
        .addUserOption(o => o
            .setName("target")
            .setDescription("the target user"))
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

        const colorArg = options.getString("color", true);
        const color = toUpperCaseString(colorArg) as ColorResolvable & string;
        if (!Colors[color]) {
            return { reply: { content: "Invalid color." }, success: false };
        }

        if (!target.moderatable) {
            return { reply: { content: "This user is immune to dyes." }, success: false };
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
            const newRoleName = color;
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

            return {
                reply: new EmbedBuilder().setColor("Blurple").setFields({
                    name: `${inlineCode(target.user.username)}'s color has been changed to ${color}`,
                    value: ` `,
                }),
                success: true
            };

        } catch (error) {
            console.error(error);
            return {
                reply: {
                    content: "An error occurred when using dye. Please try again later.",
                },
                success: false
            };
        }
    },
};
