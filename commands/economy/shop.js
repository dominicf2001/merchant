const { Items } = require("../../database/dbObjects.js");
const { EmbedBuilder } = require('discord.js');
const { tendieIconCode } = require("../../utilities.js");

module.exports = {
	data: {
        name: 'shop',
        description: 'View the shop.'
    },
	async execute(message, args) {
        const items = await Items.findAll();
        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Shop");

        items.forEach(i => {
            embed.addFields({ name: `${i.icon} ${i.name} - ${tendieIconCode} ${i.price}`, value: `${i.description}` });
        });

        return message.reply({ embeds: [embed] });
	},
};
