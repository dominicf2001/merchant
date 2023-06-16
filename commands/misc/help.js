const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: {
        name: 'help',
        description: 'Displays available commands.'
    },
    async execute(message, args) {
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Available commands");

        var i = 0;
        message.client.commands.forEach(command => {
           embed.addFields({
               name: `$${command.data.name}`,
               value: command.data.description
           });
        });
        return message.reply({ embeds: [embed] });
	},
};
