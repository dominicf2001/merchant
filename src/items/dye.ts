import { Message, Colors, ColorResolvable } from 'discord.js';
import { findTextArgs, toUpperCaseString } from '../utilities';
import { Users } from '../database/db-objects';

module.exports = {
    data: {
        name: 'dye',
        description: "Sets the color of any user's nickname.",
        price: 1500,
        icon: ":art:",
        usage: `$use dye [color] @user\n----\nView available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable.`,
        role: 1
    },
    async use(message: Message, args: string[]) {
        const target = message.mentions.members.first();
		const color = toUpperCaseString(findTextArgs(args)[0]) as ColorResolvable & string;
        
        // TODO: don't take error throwing approach?
        if (!color) {
            throw new Error('Please specify a color.');
        }

        if (!Colors[color]){
            throw new Error('Invalid color.');
        }

        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (message.author.id !== target.id) {
            await Users.addArmor(target.id, -1);
            await message.reply("This user was protected by :shield: armor. It is now broken and they are exposed.");
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

            message.channel.send(`<@${target.id}>'s color has been changed to ${color}`);
        } catch (error) {
            console.error(error);
            throw new Error("Something went wrong when setting the color.");
        }
    }
}
