import {
    Message,
    Colors,
    ColorResolvable,
    inlineCode,
    EmbedBuilder,
} from "discord.js";
import { findTextArgs, toUpperCaseString } from "../utilities";
import { UsersFactory } from "../database/db-objects";
import { Items as Item, ItemsItemId } from "../database/schemas/public/Items";

const data: Partial<Item> = {
    item_id: "dye" as ItemsItemId,
    price: 100000,
    emoji_code: ":art:",
    description: "Sets the color of any user's name",
    usage: `${inlineCode("$use dye [color] \n----\nView available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable")}`,
};

export default {
    data: data,
    async use(message: Message, args: string[]): Promise<void> {
        const Users = UsersFactory.get(message.guildId);

        const target = message.mentions.members.first();
        const colorArg: string = findTextArgs(args)[0];

        if (!colorArg) {
            throw new Error("Please specify a color.");
        }

        const color = toUpperCaseString(colorArg) as ColorResolvable & string;

        if (!target) {
            throw new Error("Please specify a target.");
        }

        if (!Colors[color]) {
            throw new Error("Invalid color.");
        }

        if (!target.moderatable) {
            throw new Error("This user is immune to dyes.");
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor && message.author.id !== target.id) {
            await Users.addArmor(target.id, -1);
            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: `Blocked by :shield: armor!`,
                value: `This user is now exposed`,
            });

            await message.reply({ embeds: [embed] });
            return;
        }

        try {
            const newRoleName = "color-" + color;
            let colorRole = (await message.guild.roles.fetch()).find(
                (role) => role.name === newRoleName,
            );
            if (!colorRole) {
                colorRole = await message.guild.roles.create({
                    name: newRoleName,
                    color: color,
                    reason: "Dye item used",
                });
            } else {
                await colorRole.setColor(color);
            }

            await target.roles.add(colorRole);

            const highestPosition = message.guild.roles.highest.position;
            await colorRole.setPosition(highestPosition - 1);

            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(target.user.username)}'s color has been changed to ${color}`,
                value: ` `,
            });

            await message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            throw new Error(
                "An error occurred when using dye. Please try again later.",
            );
        }
    },
};
