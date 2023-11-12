import { Message, inlineCode } from 'discord.js';
import { findTextArgs } from '../utilities';
import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';
import { Users } from '../database/db-objects';
const data: Item = {
    item_id: 'nametag' as ItemsItemId,
    price: 2000,
    emoji_code: ":label:",
    description: "Sets any user's nickname",
    usage: `${inlineCode("$use nametag [@user]")}`
};

export default {
    data: data,
    async use(message: Message, args: string[]): Promise<void> {
        const target = message.mentions.members.first();
        const newNickname = findTextArgs(args).slice(1).join(" ");

        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (!target.moderatable) {
            throw new Error('This user is immune to nametags.');
        }

        if (!newNickname.length) {
            throw new Error('Please specify a nickname.');
        }
        
        if (newNickname.length > 32) {
            throw new Error('This name is too long.');
        }

        const targetArmor = await Users.getArmor(target.id);
        if (targetArmor && message.author.id !== target.id) {
            Users.addArmor(target.id, -1);
            await message.channel.send('Blocked by `armor`! This user is now exposed.');
            return;
        }

        try {
            await target.setNickname(newNickname);
            await message.channel.send(`Nickname of <@${target.id}> has been changed to ${newNickname}`);
        } catch (error) {
            // TODO: make an explicit permissions check?
            throw new Error("Could not use nametag. Please try again");
        }
    }
}
