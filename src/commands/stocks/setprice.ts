import { StocksFactory } from "../../database/db-objects";
import { Message, userMention, EmbedBuilder, inlineCode, SlashCommandBuilder, GuildMember } from "discord.js";
import { CURRENCY_EMOJI_CODE, findNumericArgs } from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const data: Partial<Command> = {
    command_id: "setprice" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("setprice")
      .setDescription("Set a stock price")
      .addUserOption(o => o.setName("user").setDescription("the stock to set").setRequired(true))
      .addNumberOption(o => o.setName("amount").setDescription("the price to set it to").setRequired(true)),
    cooldown_time: 0,
    is_admin: true,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse>{
        const Stocks = StocksFactory.get(member.guild.id);

        const stockUser = options.getUser("user", true);
        const newPrice: number = options.getNumber("amount", true);

        await Stocks.updateStockPrice(stockUser.id, newPrice);

        return new EmbedBuilder().setColor("Blurple").setFields({
            name: `${inlineCode(userMention(stockUser.id))}'s price set to: ${CURRENCY_EMOJI_CODE} ${newPrice}`,
            value: ` `,
        });
    },
};
