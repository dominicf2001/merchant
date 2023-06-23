const { Users, Items } = require("../../database/dbObjects.js");
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
            user.removeItem(item.item);
            await message.client.items.get(itemName).use(message, args);
        } catch (error) {
            const userItem = await user.getItem(itemName);
            if (!userItem){
            	const item = await Items.findOne({ where: { name: { [Op.like]: itemName } } });
                await user.addItem(item);
	    }
            console.error(error);
            await message.reply("An error has occurred while attempting to use this item. Please try again.");
        }
    },
}
