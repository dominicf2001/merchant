import { Message, EmbedBuilder, inlineCode, SlashCommandBuilder } from "discord.js";
import { UsersFactory } from "../../database/db-objects";
import { CURRENCY_EMOJI_CODE, formatNumber } from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";

const data: Partial<Command> = {
    command_id: "top" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("top")
      .setDescription("See who are the goodest boys"),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const Users = UsersFactory.get(message.guildId);

        const allUsers = await Users.getAll();

        const netWorths = await Promise.all(
            allUsers.map((user) => Users.getNetWorth(user.user_id)),
        );

        const usersAndNetWorths = allUsers.map((user, index) => ({
            user,
            netWorth: netWorths[index],
        }));
        usersAndNetWorths.sort((a, b) => b.netWorth - a.netWorth);

        const topUsers = usersAndNetWorths.slice(0, 10);

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setTitle("Goodest Boys");

        let i = 1;
        for (const userAndNetworth of topUsers) {
            const { user, netWorth } = userAndNetworth;
            embed.addFields({
                name: `${i++}. ${inlineCode(user.username)}`,
                value: `${CURRENCY_EMOJI_CODE} ${formatNumber(netWorth)}`,
            });
        }

        await message.reply({ embeds: [embed] });
    },
};
