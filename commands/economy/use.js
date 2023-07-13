const { Users, Items } = require("../../database/dbObjects.js");
const { inlineCode } = require('discord.js');
const { addArmor } = require('../../database/utilities/userUtilities.js');

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

        let success = false;

        try {
            user.removeItem(item.item);
            const cachedItem = await message.client.items.get(itemName);
            if (cachedItem["data"].attack)
                await handleAttackItem(message, args, cachedItem);
             else
                await cachedItem.use(message, args);
            success = true;
        } catch (error) {
            console.error(error);
            await message.reply(error.message);
        } finally {
            if (!success) {
                await user.addItem(item.item);
            }
        }
    },
}

async function handleAttackItem(message, args, cachedItem){
    try {
        const target = message.mentions.members.first();
        const targetUser = await Users.findOne({ where: { user_id: target.id } });
        if (cachedItem["data"].attack <= targetUser.armor && (target && target.id !== message.author.id)){
            await addArmor(target.id, -cachedItem["data"].attack);
            await message.reply("This user was protected by :shield: armor. It is now broken and they are exposed.");
        }
        else {
            await cachedItem.use(message, args);
        }
    } catch (error) {
        throw error;
    }
}
