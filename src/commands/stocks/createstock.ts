import { Stocks } from "../../database/db-objects";
import { Message, EmbedBuilder, inlineCode } from "discord.js";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";

const data: Partial<Command> = {
    command_id: "createstock" as CommandsCommandId,
    description: `Creates a new stock`,
    usage: `${inlineCode("$createstock [@user]")}`,
    cooldown_time: 0,
    is_admin: true,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const stockUser = message.mentions.members.first();
        if (!stockUser) {
            throw new Error("Please specify a user.");
        }

        const stock = await Stocks.get(stockUser.id);
        if (stock) {
            throw new Error("This stock already exists!");
        } else {
            await Stocks.updateStockPrice(stockUser.id, 1);
            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(stockUser.user.username)}'s stock has been created`,
                value: ` `,
            });
            await message.reply({ embeds: [embed] });
        }

    },
};
