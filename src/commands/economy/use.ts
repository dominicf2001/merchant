import { UsersFactory, ItemsFactory } from "../../database/db-objects";
import { findTextArgs } from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Message, SlashCommandBuilder, inlineCode } from "discord.js";

const data: Partial<Command> = {
    command_id: "use" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("use")
      .setDescription("Use an item")
      .addStringOption(o => o.setName("item").setDescription("the item to use"))
      .addUserOption(o => o.setName("user").setDescription("the user to use the item on")),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        const Users = UsersFactory.get(message.guildId);
        const Items = ItemsFactory.get(message.guildId);

        let itemName = findTextArgs(args)[0];

        if (!itemName) {
            throw new Error("Please specify an item.");
        }

        const item = await Users.getItem(message.author.id, itemName);

        if (!item) {
            throw new Error("You do not have this item!");
        }

        try {
            await Items.use(itemName, message, args.slice(1));
            await Users.addItem(message.author.id, itemName, -1);
        }
        catch (error) {
            await message.reply(error.message);
        }
    },
};
