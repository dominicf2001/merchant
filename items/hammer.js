module.exports = {
    data: {
        name: 'hammer',
        price: 100000,
        icon: ":hammer:",
        description: "Destroys a channel or emoji.",
        usage: "$use hammer [channel/emoji] [name]"
    },
    async use(message, args) {
        const hammerObject = args[0];
        const hammerArgs = args.filter(arg => arg !== hammerObject);

        if (!hammerObject) {
            throw new Error('Please specify a hammer object. See $help hammer for options.');
        }

        try {
            switch (hammerObject) {
                case "emoji":
                    const emojiName = hammerArgs.join(" ");
                    const emojiId = (await message.guild.emojis.fetch())
                        .findKey(emoji => emoji.name == emojiName);
                    await message.guild.emojis.delete(emojiId);
                    message.channel.send(`${emojiName} has been demolished.`);
                    break;
                case "channel":
                    const channelName = hammerArgs.join(" ");
                    const channelId = (await message.guild.channels.fetch())
                        .findKey(channel => channel.name == channelName);
                    await message.guild.channels.delete(channelId);
                    message.channel.send(`${channelName} has been demolished.`);
                    break;
                default:
                    throw new Error('Invalid hammer object.');
            }
        } catch (error) {
            console.error(error);
            throw new Error("Hammer error. Make sure that channel or emoji exists.");
        }
    }
}
