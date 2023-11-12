import { Message, inlineCode } from 'discord.js';
import { findTextArgs } from '../utilities';
import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';

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
        const newNickname = findTextArgs(args).join(" ");

        if (!target) {
            throw new Error('Please specify a target.');
        }

        if (!newNickname.length) {
            throw new Error('Please specify a nickname.');
        }
        
        if (newNickname.length > 32) {
            throw new Error('This name is too long.');
        }

        try {
            await target.setNickname(newNickname);
            message.channel.send(`Nickname of <@${target.id}> has been changed to ${newNickname}`);
        } catch (error) {
            // TODO: make an explicit permissions check?
            throw new Error("Cannot use nametag on this user.");
        }
    }
}
