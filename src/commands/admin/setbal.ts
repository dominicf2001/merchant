import { UsersFactory } from "../../database/db-objects";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, EmbedBuilder, inlineCode } from "discord.js";
import { CURRENCY_EMOJI_CODE, findNumericArgs } from "../../utilities";

const data: Partial<Command> = {
    command_id: "setbal" as CommandsCommandId,
    description: `Set a users balance`,
    usage: `${inlineCode("$setbal [@user] [#amount]")}`,
    cooldown_time: 0,
    is_admin: true,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const Users = UsersFactory.get(message.guildId);

        const newBalance: number = +findNumericArgs(args)[0];
        const target = message.mentions.users.first() ?? message.author;

        if (!newBalance === undefined) {
            throw new Error("You must specify a balance.");
        }

        if (!target) {
            throw new Error("You must specify a target.");
        }

        await Users.setBalance(target.id, newBalance);

        const embed = new EmbedBuilder().setColor("Blurple").setFields({
            name: `${inlineCode(target.username)}'s balance set to: ${CURRENCY_EMOJI_CODE} ${newBalance}`,
            value: ` `,
        });

        await message.reply({ embeds: [embed] });
    },
};
