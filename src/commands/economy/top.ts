import { Message, EmbedBuilder, inlineCode } from "discord.js";
import { Users } from "../../database/db-objects";
import { CURRENCY_EMOJI_CODE, formatNumber } from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";

const data: Command = {
    command_id: "top" as CommandsCommandId,
    description: `See who are the goodest boys`,
    usage: `${inlineCode("$top")}`,
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
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
            let username = user.username;
            if (!username) {
                username = (await message.client.users.fetch(user.user_id)).username;
                await Users.set(user.user_id, { username: username });
            }
            embed.addFields({
                name: `${i++}. ${inlineCode(username)}`,
                value: `${CURRENCY_EMOJI_CODE} ${formatNumber(netWorth)}`,
            });
        }

        await message.reply({ embeds: [embed] });
    },
};
