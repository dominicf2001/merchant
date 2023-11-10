"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = {
    data: {
        name: 'mute',
        attack: 1,
        price: 2500,
        icon: ":mute:",
        description: "Mutes a user for 5 minutes.",
        usage: "$use mute @target",
        role: 3
    },
    async use(message, args) {
        let target = message.mentions.members.first();
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> has already been muted.`);
        }
        try {
            // TODO: should pull from the global json paramter file?
            const durationMin = 5;
            const durationMs = durationMin * 60000;
            target.timeout(durationMs);
            message.channel.send(`<@${target.id}> has been muted for ${durationMin} minutes.`);
        }
        catch (error) {
            console.error(error);
            message.channel.send(`<@${target.id}> could not be muted.`);
        }
    }
};
