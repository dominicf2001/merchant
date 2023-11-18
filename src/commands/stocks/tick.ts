import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { Message, inlineCode } from 'discord.js';
import { updateStockPrices } from '../../stock-utilities';

const data: Command = {
    command_id: 'tick' as CommandsCommandId,
    description: `Update all stock prices`,
    cooldown_time: 0,
    usage: `${inlineCode("$tick")}`,
    is_admin: true
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        try {
            await updateStockPrices();
            await message.reply("Stocks ticked");
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when ticking. Please try again later.');
        }
    }
};
