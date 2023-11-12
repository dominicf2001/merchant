import { Stocks } from '../../database/db-objects';
import { Message, userMention, EmbedBuilder, inlineCode } from 'discord.js';
import { CURRENCY_EMOJI_CODE, findNumericArgs } from '../../utilities';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';

const data: Command = {
    command_id: 'setprice' as CommandsCommandId,
    description: `Set a stock price`,
    usage: `${inlineCode("$setprice [@user] [#amount]")}`,
    cooldown_time: 0,
    is_admin: true
};

export default {
	data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const stockUser = message.mentions.members.first();
        const newPrice: number = +findNumericArgs(args);

        if (!newPrice) {
            await message.reply("Please specify a price.");
            return;            
        }
        
        if (message.author.id != "608852453315837964") {
            await message.reply("You do not have permission to use this.");
            return;
        }

        try {
            await Stocks.updateStockPrice(stockUser.id, newPrice);
            
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                    name: `${inlineCode(userMention(stockUser.id))}'s price set to: ${CURRENCY_EMOJI_CODE} ${newPrice}`,
                    value: ` `
                });
            await message.reply({ embeds: [embed] });
        } catch(error) {
            console.error("Error setting price: ", error);
            await message.reply("Error setting price.");
        }
    },
};
