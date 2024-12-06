import { UsersFactory } from "../../database/db-objects";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { EmbedBuilder, inlineCode, SlashCommandBuilder, GuildMember } from "discord.js";
import { CURRENCY_EMOJI_CODE } from "../../utilities";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const data: Partial<Command> = {
    command_id: "setbal" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("setbal")
      .setDescription("Set a users balance")
      .addUserOption(o => o.setName("user").setDescription("the user").setRequired(true))
      .addNumberOption(o => o.setName("amount").setDescription("the amount").setRequired(true)),
    cooldown_time: 0,
    is_admin: true,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const newBalance: number = options.getNumber("amount", true);
        const target = options.getUser("user", true);
        await Users.setBalance(target.id, newBalance);

        return new EmbedBuilder().setColor("Blurple").setFields({
            name: `${inlineCode(target.username)}'s balance set to: ${CURRENCY_EMOJI_CODE} ${newBalance}`,
            value: ` `,
        });
    },
};
