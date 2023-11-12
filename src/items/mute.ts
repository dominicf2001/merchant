import { Message, inlineCode } from 'discord.js';
import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';

// TODO: should pull from the global json paramter file?
const durationMin: number = 5;
const durationMs: number = durationMin * 60000;

const data: Item = {
    item_id: 'mute' as ItemsItemId,
    price: 2500,
    emoji_code: ":mute:",
    description: `Mutes a user for ${durationMin} minutes`,
    usage: `${inlineCode("$use mute [@user]")}`
};

export default {
    data: data,
    async use(message: Message, args: string): Promise<void> {
        let target = message.mentions.members.first();

        if (!target) {
            throw new Error('Please specify a target.');
        }
        
        if (target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> has already been muted.`);
        }
        
        try {
            target.timeout(durationMs);
            await message.channel.send(`<@${target.id}> has been muted for ${durationMin} minutes.`);
        } catch (error) {
            console.error(error);
            await message.channel.send(`<@${target.id}> could not be muted.`);
        }

    }
}

