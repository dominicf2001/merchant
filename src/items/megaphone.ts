import { Message } from 'discord.js';
import { findTextArgs } from '@utilities';

module.exports = {
    data: {
        name: 'megaphone',
        price: 200000,
        icon: ":mega:",
        description: "Sends your message and/or attachment as an @everyone.",
        usage: "$use megaphone [message AND/OR attachment]",
        role: 2
    },
    async use(message: Message, args: string[]) {
        const msgToSend = findTextArgs(args).join(" ");

        const attachmentsArray = [...message.attachments.values()];

        if (!msgToSend && message.attachments.size === 0) {
            throw new Error("You need to provide a message or an attachment.");
        }

        try {
            await message.delete();
        } catch (error) {
            throw new Error("Failed to delete message.");
        }

        return message.channel.send({
            content: msgToSend ? `@everyone\n\n <@${message.author.id}> says: ${msgToSend}` : '@everyone',
            files: attachmentsArray,
        });
    }
}
