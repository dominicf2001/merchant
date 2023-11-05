import { Message } from 'discord.js';

module.exports = {
    data: {
        name: 'emp',
        price: 1000,
        icon: ":zap:",
        description: 'Disables nexxy.',
        usage: '$use emp',
        role: 1
    },
    async use(message: Message, args: string[]) {
        let target;
        try {
            target = await message.guild.members.fetch("1030224702939070494");
        } catch (error) {
            throw new Error(`Couldn't fetch user with id: ${"1030224702939070494"}`);
        }

        try {
	        target.timeout(999999999);
            message.channel.send(`<@${target.id}> has been disabled. Use the battery to enable her again!`);
        } catch (error) {
            throw new Error('Error disabling nexxy.');
        }
    }
}
