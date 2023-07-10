module.exports = {
    data: {
        name: 'dye',
    },
    async use(message, args) {
		let color = args.find(arg => isNaN(arg));

        if (!color) {
            throw new Error('Please specify a color.');
        }

        let target = message.mentions.members.first() ?? message.member;

        if (!target) {
            throw new Error('Please specify a target.');
        }

        try {
            const newRoleName = 'color' + target.id;
            let colorRole = (await message.guild.roles.fetch()).find(role => role.name === newRoleName);
            color = color.charAt(0).toUpperCase() + color.slice(1);
            try {
                if (!colorRole) {
                    colorRole = await message.guild.roles.create({
                        name: newRoleName,
                        color: color,
                        reason: 'Dye item used'
                    });
                } else {
                    await colorRole.setColor(color);
                }
            } catch (error) {
                throw new Error('This is not a valid color. View available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable.');
            }

            await target.roles.add(colorRole);

            const highestPosition = message.guild.roles.highest.position;
            colorRole.setPosition(highestPosition - 1);

            message.channel.send(`<@${target.id}>'s color has been changed to ${color}`);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
