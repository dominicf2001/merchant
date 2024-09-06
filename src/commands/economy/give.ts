import { Users } from "../../database/db-objects";
import {
    findNumericArgs,
    CURRENCY_EMOJI_CODE,
    formatNumber,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, EmbedBuilder, inlineCode } from "discord.js";

const data: Command = {
    command_id: "give" as CommandsCommandId,
    description: `Share your tendies`,
    usage: `${inlineCode("$give [@user] [#amount]")}`,
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const target = message.mentions.users.first();

        if (!target) {
            throw new Error("Please specify a target.");
        }

        let authorBalance: number = await Users.getBalance(message.author.id);
        const transferAmount: number = +findNumericArgs(args)[0];

        if (!transferAmount || transferAmount <= 0) {
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

        await Users.addBalance(message.author.id, -transferAmount);
        authorBalance -= transferAmount;
        await Users.addBalance(target.id, +transferAmount);

        const embed = new EmbedBuilder().setColor("Blurple").setFields({
            name: `${CURRENCY_EMOJI_CODE} ${formatNumber(transferAmount)} transferred to: ${inlineCode(target.username)}`,
            value: `You have ${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)} remaining`,
        });

        await message.reply({ embeds: [embed] });
    },
};
