import {
    EmbedBuilder,
    SlashCommandBuilder,
    GuildMember,
} from "discord.js";
import { UsersFactory } from "../../database/db-objects";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { CommandOptions, CommandResponse, CURRENCY_EMOJI_CODE, formatNumber } from "../../utilities";

const data: Partial<Command> = {
    command_id: "bal" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
        .setName("bal")
        .setDescription("View your balance"),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);
        const authorBalance = await Users.getBalance(member.id);
        return new EmbedBuilder().setColor("Blurple").addFields({
            value: `${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)}`,
            name: `Balance`,
        });
    },
};
