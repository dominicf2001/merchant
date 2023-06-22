module.exports = {
    data: {
        name: 'mute',
    },
    async use(message, args) {
        let target = message.mentions.members.first();
        if (!target) {
            throw new Error('Please specify a target.');
        }

        const duration = 1800;

        let muteRole = (await message.guild.roles.fetch()).find(r => r.name === 'Muted'); 

        if (!muteRole) {
            try {
                muteRole = await message.guild.roles.create({
                    name: 'Muted',
                    permissions: []
                });
                let channels = await message.guild.channels.fetch();
                for (let [id, channel] of channels) {
                    console.log(id, channel);
                    await channel.permissionOverwrites.create(muteRole, {
                        SendMessages: false,
                    });
                };
            } catch (error) {
                throw new Error('Error creating the Muted role.');
            }
        } else {
	    let isMuted = target.roles.cache.has(muteRole?.id);

            if (isMuted) {
            	throw new Error("This user is already muted.");
            }
	}

        try {
            await target.roles.add(muteRole);
            message.channel.send(`<@${target.id}> has been muted for ${duration} seconds.`);

            setTimeout(async () => {
                try {
                    await target.roles.remove(muteRole);
                    message.channel.send(`<@${target.id}> has been unmuted.`);
                } catch (error) {
                    throw new Error('Error unmuting the user.');
                }
            }, duration * 1000);
        } catch (error) {
            throw new Error('Cannot mute this user.');
        }
    }
}

