import { StocksFactory } from "../../database/db-objects";
import { EmbedBuilder, inlineCode, SlashCommandBuilder, GuildMember } from "discord.js";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { CommandOptions, CommandResponse } from "src/utilities";

const data: Partial<Command> = {
    command_id: "createstock" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("createstock")
      .setDescription("Creates a new stock")
      .addUserOption(o => o.setName("user").setDescription("the user to create a stock for").setRequired(true)),
    cooldown_time: 0,
    is_admin: true,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Stocks = StocksFactory.get(member.guild.id);

        const stockUser = options.getUser("user", true);
        const stock = await Stocks.get(stockUser.id);
        if (stock) {
            throw new Error("This stock already exists!");
        } else {
            await Stocks.updateStockPrice(stockUser.id, 1);
            const embed = new EmbedBuilder().setColor("Blurple").setFields({
                name: `${inlineCode(stockUser.username)}'s stock has been created`,
                value: ` `,
            });
            return embed;
        }

    },
};
