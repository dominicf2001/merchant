const { Users } = require("../../database/dbObjects.js");
const { inlineCode } = require('discord.js');

module.exports = {
	data: {
        name: 'use',
        description: `Use an item.\n${inlineCode("$use [item]")}\n${inlineCode("$use [item] @target")}`
    },
	async execute(message, args) {
        let itemName = args.shift();
        const user = await Users.findOne({ where: { user_id: message.author.id } });
        const item = await user.getItem(itemName);

        if (!item) return await message.reply("You do not have this item!");

        try {
            await message.client.items.get(itemName).use(message, args);
            user.removeItem(item.item);
        } catch (error) {
            console.error(error);
            await message.reply(error.message);
        }
    },
}
