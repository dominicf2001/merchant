import { Users, Items } from '../../database/db-objects';
import { findTextArgs } from '../../utilities';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { Message, inlineCode } from 'discord.js';

const data: Command = {
    command_id: 'use' as CommandsCommandId,
    description: `Use an item.\n${inlineCode("$use [item]")}\n${inlineCode("$use [item] @target")}`,
    cooldown_time: 0,
    is_admin: false
};

export default {
	data: data,
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
