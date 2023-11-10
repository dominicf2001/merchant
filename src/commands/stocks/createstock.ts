import { Stocks } from '../../database/db-objects';
import { Message, EmbedBuilder } from 'discord.js';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';

const DEFAULT_STOCK_PRICE = 125;

const data: Command = {
    command_id: 'createstock' as CommandsCommandId,
    description: `Create a stock`,
    cooldown_time: 0,
    is_admin: true
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const user = message.mentions.users.first();

        if (!user) {
            await message.reply("Please specify a target.");
            return;
        }

        // TODO: pull or lookup
        if (message.author.id != "608852453315837964") {
            await message.reply("You do not have permission to use this.");
            return;
        }

        try {
            await Stocks.set(user.id, {
                price: DEFAULT_STOCK_PRICE
            });

            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                    name: `Stock has been created.`,
                    value: ` `
                });
            await message.reply({ embeds: [embed] });
        } catch(error) {
            console.error("Error creating stock: ", error);
            await message.reply("Error creating stock.");
        }

    }
};
