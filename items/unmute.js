module.exports = {
    data: {
        name: 'unmute',
    },
    async use(message, args) {
        let target = message.mentions.members.first();
        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (!target.isCommunicationDisabled()){
	        throw new Error(`<@${target.id}> has not been muted.`);
        }
	try {
	    target.timeout(null);
	    return message.channel.send(`<@${target.id}> has been unmuted.`);
	} catch (error) {
	    return message.channel.send(`<@${target.id}> could not be unmuted.`);
	}
   }
}
