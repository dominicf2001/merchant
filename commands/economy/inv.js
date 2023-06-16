const { getBalance } = require("../../database/utilities/userUtilities.js");
const { Users } = require("../../database/dbObjects.js");
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: {
        name: 'inv',
        description: 'View your inventory.'
    },
	async execute(message, args) {
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        const items = user ? await user.getItems() : [];

        if (!items.length) return message.reply(`You have nothing!`);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Inventory");

        items.forEach(i => {
            embed.addFields({ name: `${i.item.icon} ${i.item.name} - Q. ${i.quantity}`, value: ` ` });
        });

        return message.reply({ embeds: [embed] });
	},
}
