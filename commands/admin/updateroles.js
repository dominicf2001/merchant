const { EmbedBuilder, inlineCode } = require('discord.js');
const { updateRoles } = require("../../rolesCron.js");

module.exports = {
	data: {
        name: 'updateroles',
        description: `(ADMIN) Set all users roles.\n${inlineCode("$updateroles")}`
    },
	async execute(message, args) {
        if (message.author.id != "608852453315837964") {
            return message.reply("You do not have permission to use this.");
        }

        await updateRoles();

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: `Roles updated.`,
                value: ` `
            });

        return message.reply({ embeds: [embed] });
    }
}
