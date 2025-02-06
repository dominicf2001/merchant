import { ITEMS } from "src/database/datastores/Items";
import { UsersFactory, ItemsFactory } from "../../database/db-objects";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { GuildMember, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import { CommandOptions, CommandResponse, ItemResponse } from "src/utilities";

let metadata = new SlashCommandBuilder()
    .setName("use")
    .setDescription("Use an item");

for (const subcommand of ITEMS) {
    metadata = metadata.addSubcommand(_ => subcommand.data.metadata as SlashCommandSubcommandBuilder) as SlashCommandBuilder
}

const data: Partial<Command> = {
    command_id: "use" as CommandsCommandId,
    metadata,
    cooldown_time: 0,
    is_admin: false,
};

export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Users = UsersFactory.get(member.guild.id);
        const Items = ItemsFactory.get(member.guild.id);

        const itemName = options.getSubcommand(true);
        const item = await Users.getItem(member.id, itemName);
        if (!item) {
            return { content: "You do not have this item!" };
        }

        const itemReply: ItemResponse = await Items.use(itemName, member, options);
        if (itemReply.success) {
            await Users.addItem(member.id, itemName, -1);
        }
        return itemReply.reply;
    },
};
