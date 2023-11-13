import { Users } from '../../database/db-objects';
import { CURRENCY_EMOJI_CODE, formatNumber, ITEM_ROB_CHANCE, CURRENCY_ROB_CHANCE, MAX_INV_SIZE,
         CURRENCY_ROB_PERCENTAGE, ITEM_FINE_PERCENTAGE, CURRENCY_FINE_PERCENTAGE,
         findTextArgs, getRandomFloat, getRandomInt } from '../../utilities';
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
        try {
            const robType: RobType = (findTextArgs(args)[0] ?? 'tendies') as RobType;
            const target = message.mentions.users.first();
            // if (author.role < 1) throw new Error(`Your role is too low to use this command. Minimum role is: ${inlineCode("Fakecel")}`);

            if (!target) {
                await message.reply("Please specify a target.");
                return;
            }

            if (target.id === message.author.id) {
                await message.reply("You cannot rob yourself.");
                return;
            }

            if (!isValidRobType(robType)) {
                await message.reply("Invalid rob type.");
                return;
            }
            let reply = "";

            switch (robType) {
                case 'tendies':
                    if (getRandomInt(1, 100) >= CURRENCY_ROB_CHANCE) {
                        const targetBalance = await Users.getBalance(target.id);
                        const robAmount: number = Math.floor(targetBalance * (CURRENCY_ROB_PERCENTAGE / 100));

                        await Users.addBalance(message.author.id, robAmount);
                        await Users.addBalance(target.id, -robAmount);

                        reply = `You have robbed ${CURRENCY_EMOJI_CODE} ${formatNumber(robAmount)} from: ${inlineCode(target.username)}.`;
                    }
                    else {
                        const authorBalance = await Users.getBalance(message.author.id);
                        const penaltyAmount: number = Math.floor(authorBalance * (CURRENCY_FINE_PERCENTAGE / 100));

                        await Users.addBalance(message.author.id, -penaltyAmount);

                        reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${CURRENCY_EMOJI_CODE} ${formatNumber(penaltyAmount)} `;
                    }
                    break;
                case 'item':
                    if (getRandomInt(1, 100) >= ITEM_ROB_CHANCE) {
                        const targetItems = await Users.getItems(target.id);
                        const authorItemCount: number = await Users.getItemCount(message.author.id);


                        if (authorItemCount >= MAX_INV_SIZE) {
                            await message.reply("Your inventory is full.");
                            return;
                        }

                        if (!targetItems.length) {
                            await message.reply("This user has no items.");
                            return;
                        }

                        const item = targetItems[Math.floor(Math.random() * targetItems.length)];

                        await Users.addItem(target.id, item.item_id, -1);
                        await Users.addItem(message.author.id, item.item_id, 1);

                        reply = `You have robbed ${item.item_id} from: ${inlineCode(target.username)}.`;
                    }
                    else {
                        const authorBalance = await Users.getBalance(message.author.id);
                        const penaltyAmount: number = Math.floor(authorBalance * (ITEM_FINE_PERCENTAGE / 100));

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

            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when robbing. Please try again later.');
        }
    }
}
