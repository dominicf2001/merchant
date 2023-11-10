"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utilities_1 = require("../utilities");
module.exports = {
    data: {
        name: 'nametag',
        description: "Sets any user's nickname.",
        price: 2000,
        icon: ":label:",
        attack: 1,
        usage: '$use nametag @target [name]',
        role: 2
    },
    async use(message, args) {
        const target = message.mentions.members.first();
        const newNickname = (0, utilities_1.findTextArgs)(args).join(" ");
        if (!target) {
            throw new Error('Please specify a target.');
        }
        if (!newNickname.length) {
            throw new Error('Please specify a nickname.');
        }
        if (newNickname.length > 32) {
            throw new Error('This name is too long.');
        }
        try {
            await target.setNickname(newNickname);
            message.channel.send(`Nickname of <@${target.id}> has been changed to ${newNickname}`);
        }
        catch (error) {
            // TODO: make an explicit permissions check?
            throw new Error("Cannot use nametag on this user.");
        }
    }
};
