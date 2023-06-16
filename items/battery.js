module.exports = {
    data: {
        name: 'battery',
    },
    async use(message, args) {
        let target;
        try {
            target = await message.guild.members.fetch("1030224702939070494");
        } catch (error) {
            throw new Error(`Couldn't fetch user with id: ${"1030224702939070494"}`);
        }

        let disabledRole = (await message.guild.roles.fetch()).find(r => r.name === 'Disabled');

        if (!disabledRole) {
            try {
                disabledRole = await message.guild.roles.create({
                    name: 'Disabled',
                    permissions: []
                });

                let channels = await message.guild.channels.fetch();
                for (let [id, channel] of channels) {
                    await channel.permissionOverwrites.create(disabledRole, {
                        SendMessages: false,
                    });
                };
            } catch (error) {
                throw new Error('Error creating the Disabled role.');
            }
        }

        if (!target.roles.cache.has(disabledRole.id)) {
            throw new Error(`<@${target.id}> is not disabled.`);
        }

        try {
            await target.roles.remove(disabledRole);
            message.channel.send(`<@${target.id}> has been enabled. Use the emp to disable her again!`);
        } catch (error) {
            throw new Error('Error enabling nexxy.');
        }
    }
}
