import { Message } from 'discord.js';

module.exports = {
    data: {
        name: 'unmute',
        price: 2000,
        icon: ":loud_sound:",
        description: "Unmutes a user.",
        usage: "$use unmute @target",
        role: 2
    },
    async use(message: Message, args: string[]) {
        let target = message.mentions.members.first();

        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (!target.isCommunicationDisabled().valueOf()) {
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
