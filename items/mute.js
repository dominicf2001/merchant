module.exports = {
    data: {
        name: 'mute',
    },
    async use(message, args) {
        let target = message.mentions.members.first();
        if (!target) {
            throw new Error('Please specify a target.');
        }

        const duration = 1800000;
	try {
	    target.timeout(duration);
	    message.channel.send(`<@${target.id}> has been muted for 30 minutes.`);
	} catch (error) {
	    message.channel.send(`<@${target.id}> could not be muted.`);
	}

   }
}

