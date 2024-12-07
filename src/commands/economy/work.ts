import { UsersFactory } from "../../database/db-objects";
import { EmbedBuilder, SlashCommandBuilder, GuildMember } from "discord.js";
import { CommandOptions, CommandResponse, CURRENCY_EMOJI_CODE, getRandomInt } from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { CommandObj } from "src/database/datastores/Commands";

const data: Partial<Command> = {
    command_id: "work" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("work")
      .setDescription("Make some tendies"),
    cooldown_time: 1800000,
    is_admin: false,
};

export default <CommandObj>{
    data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const tendiesMade = getRandomInt(10, 50);
        await Users.addBalance(member.id, tendiesMade);

        return new EmbedBuilder().setColor("Blurple").addFields({
            value: `You make: ${CURRENCY_EMOJI_CODE} ${tendiesMade} tendies!`,
            name: ` `,
        });
    },
};
