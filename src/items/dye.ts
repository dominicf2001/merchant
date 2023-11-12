import { Message, Colors, ColorResolvable, inlineCode } from 'discord.js';
import { findTextArgs, toUpperCaseString } from '../utilities';
import { Users } from '../database/db-objects';
import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';

const data: Item = {
    item_id: 'dye' as ItemsItemId,
    price: 1500,
    emoji_code: ":art:",
    description: "Sets the color of any user's name",
    usage: `${inlineCode("$use dye [color] \n----\nView available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable")}`
}

export default {
    data: data,
    async use(message: Message, args: string[]): Promise<void> {
        const target = message.mentions.members.first();
		const color = toUpperCaseString(findTextArgs(args)[1]) as ColorResolvable & string;
        
        if (!color) {
            throw new Error('Please specify a color.');
        }
        
        if (!Colors[color]){
            throw new Error('Invalid color.');
        }

        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (!target.moderatable) {
            throw new Error('This user is immune to dyes.');   
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor && message.author.id !== target.id) {
            await Users.addArmor(target.id, -1);
            await message.channel.send('Blocked by `armor`! This user is now exposed.');
            return;
        }

        try {
            const newRoleName = 'color' + target.id;
            let colorRole = (await message.guild.roles.fetch()).find(role => role.name === newRoleName);
            if (!colorRole) {
                colorRole = await message.guild.roles.create({
                    name: newRoleName,
                    color: color,
                    reason: 'Dye item used'
                });
            }
            else {
                await colorRole.setColor(color);
            }

            await target.roles.add(colorRole);

            const highestPosition = message.guild.roles.highest.position;
            await colorRole.setPosition(highestPosition - 1);

            await message.reply(`<@${target.id}>'s color has been changed to ${color}`);
        } catch (error) {
            console.error(error);
            throw new Error("Could not use dye. Please try again.");
        }
    }
}
