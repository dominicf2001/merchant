module.exports = {
    data: {
        name: 'nametag',
    },
    async use(message, args) {
        const targetArg = args.filter(arg => arg.startsWith('<@') && arg.endsWith('>'))[0];
        const newNicknameArgs = args.filter(arg => arg !== targetArg);

        if (!targetArg) {
            throw new Error('Please specify a target.');
        }

        let id = targetArg.slice(2, -1);

        if (id.startsWith('!')) {
            id = id.slice(1);
        }

        const target = message.guild.members.cache.get(id);

        if (!target) {
            throw new Error('Invalid target specified.');
        }

        const newNickname = newNicknameArgs.join(" ");

        try {
            await target.setNickname(newNickname);
            message.channel.send(`Nickname of <@${target.id}> has been changed to ${newNickname}`);
        } catch (error) {
            throw new Error("Cannot use nametag on this user.");
        }
    }
}
