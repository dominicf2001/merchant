import { Users, Items } from '@database';
import { findTextArgs } from '@utilities';
import { Message } from 'discord.js';

module.exports = {
	data: {
        name: 'use',
        description: `Use an item.\n${inlineCode("$use [item]")}\n${inlineCode("$use [item] @target")}`
    },
	async execute(message: Message, args: string[]): Promise<void> {
        let itemName = findTextArgs(args)[0];
        const item = await Users.getItem(message.author.id, itemName);

        if (!item) {
            await message.reply("You do not have this item!");
            return;
        }

        try {
            await Users.addItem(message.author.id, itemName, -1);
            await Items.use(itemName, message, args);
        }
        catch (error) {
            await message.reply(error.message);
        }
    },
}
