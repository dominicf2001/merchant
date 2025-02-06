import { UsersFactory } from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    formatNumber,
    ITEM_ROB_CHANCE,
    CURRENCY_ROB_CHANCE,
    MAX_INV_SIZE,
    CURRENCY_ROB_PERCENTAGE,
    ITEM_FINE_PERCENTAGE,
    CURRENCY_FINE_PERCENTAGE,
    getRandomInt,
    CommandResponse,
    CommandOptions,
    makeChoices,
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { EmbedBuilder, inlineCode, SlashCommandBuilder, GuildMember } from "discord.js";
import { CommandObj } from "src/database/datastores/Commands";

enum RobType {
    tendies = "tendies",
    item = "item",
}

function isValidRobType(robType: string): robType is RobType {
    return Object.keys(RobType).includes(robType as RobType);
}

const data: Partial<Command> = {
    command_id: "rob" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
        .setName("rob")
        .setDescription("Rob user of tendies or a random item with a chance of failure + fine")
        .addStringOption(o => o.setName("type")
            .setDescription("the thing you want to rob")
            .addChoices(makeChoices("tendies", "item"))
            .setRequired(true))
        .addUserOption(o => o.setName("target")
            .setDescription("the user you want to rob")
            .setRequired(true)),
    cooldown_time: 1800000,
    is_admin: false,
};

export default <CommandObj>{
    data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);

        const robType: RobType = options.getString("type", true) as RobType;
        const target = options.getUser("target", true);
        // if (author.role < 1) throw new Error(`Your role is too low to use this command. Minimum role is: ${inlineCode("Fakecel")}`);

        if (target.id === member.id) {
            return { content: "You cannot rob yourself." };
        }

        if (!isValidRobType(robType)) {
            return { content: "Invalid rob type." };
        }

        let reply = "";
        switch (robType) {
            case "tendies":
                if (getRandomInt(1, 100) >= CURRENCY_ROB_CHANCE) {
                    const targetBalance = await Users.getBalance(target.id);
                    const robAmount: number = Math.ceil(
                        targetBalance * (CURRENCY_ROB_PERCENTAGE / 100),
                    );

                    await Users.addBalance(member.id, robAmount);
                    await Users.addBalance(target.id, -robAmount);

                    reply = `You have robbed ${CURRENCY_EMOJI_CODE} ${formatNumber(robAmount)} from: ${inlineCode(target.username)}.`;
                } else {
                    const authorBalance = await Users.getBalance(
                        member.id,
                    );
                    const penaltyAmount: number = Math.ceil(
                        authorBalance * (CURRENCY_FINE_PERCENTAGE / 100),
                    );

                    await Users.addBalance(member.id, -penaltyAmount);

                    reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${CURRENCY_EMOJI_CODE} ${formatNumber(penaltyAmount)} `;
                }
                break;
            case "item":
                if (getRandomInt(1, 100) >= ITEM_ROB_CHANCE) {
                    const targetItems = await Users.getItems(target.id);
                    const authorItemCount: number = await Users.getItemCount(
                        member.id,
                    );

                    if (authorItemCount >= MAX_INV_SIZE) {
                        return { content: "Your inventory is full." };
                    }

                    if (!targetItems.length) {
                        return { content: "This user has no items." };
                    }

                    const item =
                        targetItems[
                        Math.floor(Math.random() * targetItems.length)
                        ];

                    await Users.addItem(target.id, item.item_id, -1);
                    await Users.addItem(member.id, item.item_id, 1);

                    reply = `You have robbed ${item.item_id} from: ${inlineCode(target.username)}.`;
                } else {
                    const authorBalance = await Users.getBalance(
                        member.id,
                    );
                    const penaltyAmount: number = Math.floor(
                        authorBalance * (ITEM_FINE_PERCENTAGE / 100),
                    );

                    await Users.addBalance(member.id, -penaltyAmount);

                    reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${CURRENCY_EMOJI_CODE} ${formatNumber(penaltyAmount)} `;
                }
                break;
        }

        return new EmbedBuilder().setColor("Blurple").setFields({
            name: reply,
            value: ` `,
        })
    },
};
