"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _utilities_1 = require("@utilities");
module.exports = {
    data: {
        name: 'megaphone',
        price: 200000,
        icon: ":mega:",
        description: "Sends your message and/or attachment as an @everyone.",
        usage: "$use megaphone [message AND/OR attachment]",
        role: 2
    },
    async use(message, args) {
        const msgToSend = (0, _utilities_1.findTextArgs)(args).join(" ");
        const attachmentsArray = [...message.attachments.values()];
        if (!msgToSend && message.attachments.size === 0) {
            throw new Error("You need to provide a message or an attachment.");
        }
        try {
            await message.delete();
        }
        catch (error) {
            throw new Error("Failed to delete message.");
        }
        return message.channel.send({
            content: msgToSend ? `@everyone\n\n <@${message.author.id}> says: ${msgToSend}` : '@everyone',
            files: attachmentsArray,
        });
    }
};
