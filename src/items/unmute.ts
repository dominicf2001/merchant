import { Message, inlineCode } from 'discord.js';
import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';

const data: Item = {
    item_id: 'unmute' as ItemsItemId,
    price: 750,
    emoji_code: ":loud_sound:",
    description: "Unmutes a user",
    usage: `${inlineCode("$use unmute [@user]")}`
};

module.exports = {
    data: data,
    async use(message: Message, args: string[]): Promise<void> {
        let target = message.mentions.members.first();

        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (!target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> has not been muted.`);
        }
        
        try {
            await target.timeout(null);
            await message.reply(`<@${target.id}> has been unmuted.`);
        } catch (error) {
            throw new Error(`Could not use unmute. Please try again.`);
        }
    }
}
