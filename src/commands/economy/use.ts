import { UsersFactory, ItemsFactory } from "../../database/db-objects";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { GuildMember, SlashCommandBuilder } from "discord.js";
import { CommandOptions, CommandResponse } from "src/command-utilities";

const data: Partial<Command> = {
    command_id: "use" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("use")
      .setDescription("Use an item"),
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);
        const Items = ItemsFactory.get(member.guild.id);

        const itemName = options.getString("item", true);
        const item = await Users.getItem(member.id, itemName);
        if (!item) {
            throw new Error("You do not have this item!");
        }

        try {
            await Items.use(itemName, member, options);
            await Users.addItem(member.id, itemName, -1);
        }
        catch (error) {
            return error.message;
        }
    },
};
