import { Message, inlineCode } from 'discord.js';
import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';
import { Users } from '../database/db-objects';

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

        if (!target.moderatable) {
            throw new Error('This user is immune to mutes.');   
        }
        
        if (target.isCommunicationDisabled().valueOf()) {
            throw new Error(`<@${target.id}> is already muted.`);
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor) {
            Users.addArmor(target.id, -1);
            await message.channel.send('Blocked by `armor`! This user is now exposed.');
            return;
        }
        
        try {
            await target.timeout(durationMs);
            await message.channel.send(`<@${target.id}> has been muted for ${durationMin} minutes.`);
        } catch (error) {
            console.error(error);
            throw new Error(`Could not use mute. Please try again.`);
        }

    }
}
