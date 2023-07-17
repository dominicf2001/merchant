const { getBalance } = require("../../database/utilities/userUtilities.js");
const { Users } = require("../../database/dbObjects.js");
const { EmbedBuilder } = require('discord.js');
const { formatNumber } = require("../../utilities.js");

module.exports = {
	data: {
        name: 'inv',
        description: 'View your inventory.'
    },
	async execute(message, args) {
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        const items = user ? await user.getItems() : [];
        const armor = user.armor;

        const totalQuantity = items.reduce((previous, current) => {
                return previous + current["quantity"];
            }, 0);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Inventory")
            .setDescription(`:school_satchel: ${totalQuantity}/5 - - :shield: ${armor}/1\n------------------------`);

        console.log(items);
        items?.forEach(i => {
            embed.addFields({ name: `${i.item.icon} ${i.item.name} - Q. ${formatNumber(i.quantity)}`, value: ` ` });
        });

        return message.reply({ embeds: [embed] });
	},
}
