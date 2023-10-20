const { updateUserRoleLevel } = require("../../database/utilities/userUtilities.js");
const { EmbedBuilder, inlineCode } = require('discord.js');
const { client } = require("../../index.js");
const { Users } = require("../../database/dbObjects.js");
const { updateRoles } = require("../../rolesCron.js");

module.exports = {
	data: {
        name: 'setrole',
        description: `(ADMIN) Set a users balance.\n${inlineCode("$addbalance @target amount")}`
    },
	async execute(message, args) {
        if (message.author.id != "608852453315837964") {
            return message.reply("You do not have permission to use this.");
        }

        const targetArg = args.filter(arg => arg.startsWith('<@') && arg.endsWith('>'))[0];
		let newRole = args.find(arg => isNaN(arg) && !arg.startsWith('<@') && !arg.endsWith('>'));

        if (!newRole) {
            return message.reply("You must specify a role.");
        };

        newRole = newRole.charAt(0).toUpperCase() + newRole.slice(1);

        if (!targetArg) {
            return message.reply('Please specify a target.');
        }

        let id = targetArg.slice(2, -1);

        if (id.startsWith('!')) {
            id = id.slice(1);
        }

        const target = await Users.findOne({ where: { user_id: id } });

        if (!target) {
            return message.reply('Invalid target specified.');
        }

        if (!target) {
            return message.reply("You must specify a target.");
        }

        const guild = client.guilds.cache.get("608853914535854101");

        updateUserRoleLevel(guild, target, newRole);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: `Role set to: ${newRole}`,
                value: ` `
            });

        return message.reply({ embeds: [embed] });
    }
}
