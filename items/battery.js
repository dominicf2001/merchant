module.exports = {
    data: {
        name: 'battery',
        price: 500,
        icon: ":battery:",
        description: 'Enables nexxy.',
        usage: '$use battery',
        role: 1
    },
    async use(message, args) {
        let target;
        try {
            target = await message.guild.members.fetch("1030224702939070494");
        } catch (error) {
            throw new Error(`Couldn't fetch user with id: ${"1030224702939070494"}`);
        }

        try {
	        target.timeout(null);
            message.channel.send(`<@${target.id}> has been enabled. Use the emp to disable her again!`);
        } catch (error) {
            throw new Error('Error enabling nexxy.');
        }
    }
}
