import { Users } from '../../database/db-objects';
import { CURRENCY_EMOJI_CODE, formatNumber, findTextArgs, getRandomFloat, getRandomInt } from '../../utilities';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { Message, EmbedBuilder, inlineCode } from 'discord.js';

enum RobType {
    tendies = 'tendies',
    item = 'item'
}

function isValidRobType(robType: string): robType is RobType {
    return Object.keys(RobType).includes(robType as RobType);
}

const data: Command = {
    command_id: 'rob' as CommandsCommandId,
    description: `Rob user of tendies or a random item with a chance of failure + fine`,
    usage: `${inlineCode("$rob [@user] [tendies/item]")}`,
    cooldown_time: 5000,
    is_admin: false
};

export default {
    data: data,
	async execute(message: Message, args: string[]): Promise<void> {
		const robType: RobType = (findTextArgs(args)[0] ?? 'tendies') as RobType;
        const target = message.mentions.users.first();
        // if (author.role < 1) throw new Error(`Your role is too low to use this command. Minimum role is: ${inlineCode("Fakecel")}`);

        if (!target){
            message.reply("Please specify a target.");
            return;
        }

        if (target.id === message.author.id){
            message.reply("You cannot rob yourself.");
            return;
        }

        if (!isValidRobType(robType)) {
            message.reply("Invalid rob type.");
            return;
        }
        // TODO: move to json
        const TENDIES_ROB_CHANCE = 70;
        const ITEM_ROB_CHANCE = 20;
        const MAX_ITEM_COUNT = 5;
        let reply = "";
        
        switch (robType) {
            case 'tendies':
                if (getRandomInt(1, 100) > TENDIES_ROB_CHANCE) {
                    const targetBalance = await Users.getBalance(target.id);
                    const robAmount: number = Math.floor(targetBalance * getRandomFloat(.01, .10));
                    
                    await Users.addBalance(message.author.id, robAmount);
                    await Users.addBalance(target.id, -robAmount);

                    reply = `You have robbed ${CURRENCY_EMOJI_CODE} ${formatNumber(robAmount)} from: ${inlineCode(target.username)}.`;
                }
                else {
                    const authorBalance = await Users.getBalance(message.author.id);
                    const penaltyAmount: number = Math.floor(authorBalance * getRandomFloat(.03, .15));

                    await Users.addBalance(message.author.id, -penaltyAmount);

                    reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${CURRENCY_EMOJI_CODE} ${formatNumber(penaltyAmount)} `;
                }
                break;
            case 'item':
                if (getRandomInt(1, 100) > ITEM_ROB_CHANCE) {
                    const targetItems = await Users.getItems(target.id);
                    const authorItemCount: number = await Users.getItemCount(message.author.id);


                    if (authorItemCount >= MAX_ITEM_COUNT) {
                        message.reply("Your inventory is full.");
                        return;
                    }

                    if (!targetItems.length) {
                        message.reply("This user has no items.");
                        return;
                    }

                    const item = targetItems[Math.floor(Math.random() * targetItems.length)];

                    await Users.addItem(target.id, item.item_id, -1);
                    await Users.addItem(message.author.id, item.item_id, 1);

                    reply = `You have robbed ${item.item_id} from: ${inlineCode(target.username)}.`;
                }
                else {
                    const authorBalance = await Users.getBalance(message.author.id);
                    const penaltyAmount: number = Math.floor(authorBalance * getRandomFloat(.03, .15));

                    await Users.addBalance(message.author.id, -penaltyAmount);

                    reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${CURRENCY_EMOJI_CODE} ${formatNumber(penaltyAmount)} `;
                }
                break;
        }

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: reply,
                value: ` `
            });

        message.reply({ embeds: [embed] });
    },
}
