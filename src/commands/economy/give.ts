import { UsersFactory } from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    formatNumber,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, EmbedBuilder, inlineCode, SlashCommandBuilder, GuildMember } from "discord.js";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const data: Partial<Command> = {
    command_id: "give" as CommandsCommandId,
    metadata: new SlashCommandBuilder().setName("give")
      .setDescription("Share your tendies")
      .addUserOption(o => o.setName("target").setDescription("the user to give tendies to").setRequired(true))
      .addNumberOption(o => o.setName("amount").setDescription("the amount to give").setRequired(true)),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const target = options.getUser("target", true);
        const transferAmount = options.getNumber("amount", true);
        let authorBalance: number = await Users.getBalance(member.id);

        if (transferAmount <= 0) {
            throw new Error(`Specify more than zero tendies.`);
        }

        if (!Number.isInteger(transferAmount)) {
            throw new Error(`You can only give a whole number of tendies.`);
        }

        if (transferAmount > authorBalance) {
            throw new Error(
                `You only have ${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)} tendies.`,
            );
        }

        await Users.addBalance(member.id, -transferAmount);
        authorBalance -= transferAmount;
        await Users.addBalance(target.id, +transferAmount);

        const embed = new EmbedBuilder().setColor("Blurple").setFields({
            name: `${CURRENCY_EMOJI_CODE} ${formatNumber(transferAmount)} transferred to: ${inlineCode(target.username)}`,
            value: `You have ${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)} remaining`,
        });

        return embed;
    },
};
