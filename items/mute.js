module.exports = {
    data: {
        name: 'mute',
        attack: 1,
        price: 500000,
        icon: ":mute:",
        description: "Mutes a user for 5 minutes.",
        usage: "$use mute @target"
    },
    async use(message, args) {
        let target = message.mentions.members.first();
        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (target.isCommunicationDisabled()){
	        throw new Error(`<@${target.id}> has already been muted.`);
        }

        const duration = 300000;
	try {
	    target.timeout(duration);
	    message.channel.send(`<@${target.id}> has been muted for 5 minutes.`);
	} catch (error) {
        console.error(error);
	    message.channel.send(`<@${target.id}> could not be muted.`);
	}
   }
}

