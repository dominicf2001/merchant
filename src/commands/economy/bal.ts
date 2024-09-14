import { Message, EmbedBuilder, inlineCode } from "discord.js";
import { UsersFactory } from "../../database/db-objects";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { CURRENCY_EMOJI_CODE, formatNumber } from "../../utilities";

const data: Partial<Command> = {
    command_id: "bal" as CommandsCommandId,
    description: `View your balance`,
    usage: `${inlineCode("$bal")}`,
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const Users = UsersFactory.get(message.guildId);

        const authorBalance = await Users.getBalance(message.author.id);

        const embed = new EmbedBuilder().setColor("Blurple").addFields({
            value: `${CURRENCY_EMOJI_CODE} ${formatNumber(authorBalance)}`,
            name: `Balance`,
        });

        await message.reply({ embeds: [embed] });
    },
};
