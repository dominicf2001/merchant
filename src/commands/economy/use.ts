import { Users, Items } from '../../database/db-objects';
import { findTextArgs } from '../../utilities';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { Message, inlineCode } from 'discord.js';

const data: Command = {
    command_id: 'use' as CommandsCommandId,
    description: `Use an item`,
    usage: `${inlineCode("$use [item]")}\n${inlineCode("$use [item] [@user]")}`,
    cooldown_time: 0,
    is_admin: false
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        try {
            let itemName = findTextArgs(args)[0];

            if (!itemName) {
                await message.reply("Please specifiy an item.");
                return;
            }

            const item = await Users.getItem(message.author.id, itemName);

            if (!item) {
                await message.reply("You do not have this item!");
                return;
            }

            try {
                await Items.use(itemName, message, args);
                await Users.addItem(message.author.id, itemName, -1);
            }
            catch (error) {
                await message.reply(error.message);
            }
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when using this item. Please try again later.');
        }
    }
}
