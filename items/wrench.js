module.exports = {
    data: {
        name: 'wrench',
        price: 100000,
        icon: ":wrench:",
        description: "Creates a new channel or emoji.",
        usage: "$use wrench [channel/emoji] [name] [attachment (emoji only)]"
    },
    async use(message, args) {
        const wrenchObject = args[0];
        const wrenchArgs = args.filter(arg => arg !== wrenchObject);

        if (!wrenchObject) {
            throw new Error('Please specify a wrench object. See $help wrench for options.');
        }

        try {
            switch (wrenchObject) {
                case "emoji":
                    const emojiUrl = message.attachments.first()["url"];
                    const emojiName = wrenchArgs.join(" ");
                    await message.guild.emojis.create({
                        attachment: emojiUrl,
                        name: emojiName
                    });
                    message.channel.send("A new emoji has been constructed.");
                    break;
                case "channel":
                    const newChannelName = wrenchArgs.join(" ");
                    await message.guild.channels.create({ name: newChannelName });
                    message.channel.send("A new channel has been constructed.");
                    break;
                default:
                    throw new Error('Invalid wrench object.');
            }
        } catch (error) {
            console.error(error);
            throw new Error("Wrench error. Try adjusting the image size or name length.");
        }
    }
}
