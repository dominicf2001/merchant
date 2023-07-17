const { EmbedBuilder } = require("discord.js");
const { addArmor } = require("../database/utilities/userUtilities.js");
const { Users } = require("../database/dbObjects.js");

module.exports = {
    data: {
        name: 'armor',
        price: 750,
        icon: ":shield:",
        description: "Protects against nametag, dye, and mute. Can only apply one at a time.",
        usage: "$use armor",
        role: 2
    },
    async use(message, args) {
        try {
            const user = await Users.findOne({ where: { user_id: message.author.id } });

            if (user.armor >= 1){
                return message.reply("You can only apply one armor at a time.");
            }

            addArmor(message.author.id, 1);

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                    name: ":shield: Armor has been applied.",
                    value:" "
                });

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
