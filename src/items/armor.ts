import { EmbedBuilder, Message } from "discord.js";
import { Users } from "../database/db-objects";

module.exports = {
    data: {
        name: 'armor',
        price: 750,
        icon: ":shield:",
        description: "Protects against nametag, dye, and mute. Can only apply one at a time.",
        usage: "$use armor",
        role: 2
    },
    async use(message: Message, args: string[]) {
        try {
            const authorArmor = await Users.getArmor(message.author.id);

            if (authorArmor >= 1){
                return message.reply("You can only apply one armor at a time.");
            }

            Users.addArmor(message.author.id, 1);

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
