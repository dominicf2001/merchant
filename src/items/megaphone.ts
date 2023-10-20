module.exports = {
    data: {
        name: 'megaphone',
        price: 200000,
        icon: ":mega:",
        description: "Sends your message and/or attachment as an @everyone.",
        usage: "$use megaphone [message/attachment]",
        role: 2
    },
    async use(message, args) {
        const toSend = args.join(" ");

        const attachmentsArray = [...message.attachments.values()];

        if (!toSend && message.attachments.size === 0) {
            throw new Error("You need to provide a message or an attachment.");
        }

        try {
            await message.delete();
        } catch (error) {
            throw new Error("Failed to delete message.");
        }

        return message.channel.send({
            content: toSend ? `@everyone\n\n <@${message.author.id}> says: ${toSend}` : '@everyone',
            files: attachmentsArray,
        });
    }
}
