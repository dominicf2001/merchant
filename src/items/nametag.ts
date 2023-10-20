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

        if (newNickname.length > 32) {
            throw new Error('This name is too long.');
        }

        try {
            await target.setNickname(newNickname);
            message.channel.send(`Nickname of <@${target.id}> has been changed to ${newNickname}`);
        } catch (error) {
            throw new Error("Cannot use nametag on this user.");
        }
    }
}
