import { CommandsFactory, ItemsFactory } from "../../database/db-objects";
import {
    PaginatedMenuBuilder,
    client,
} from "../../utilities";
import {
    Events,
    EmbedBuilder,
    SlashCommandBuilder,
    APIApplicationCommandOption,
    GuildMember,
    InteractionReplyOptions,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { buildUsageTag, CommandOptions, CommandResponse } from "src/command-utilities";

const HELP_ID: string = "help";
const HELP_PAGE_SIZE: number = 5;

const data: Partial<Command> = {
    command_id: "help" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
      .setName("help")
      .setDescription("Displays available commands or displays info on a command/item")
      .addStringOption(o => o.setName("search").setDescription("the item or command you need help on"))
      .addNumberOption(o => o.setName("page").setDescription("the page of the help menu")),
    cooldown_time: 0,
    is_admin: false,
};

// TODO: implement paging
export default {
    data: data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const Commands = CommandsFactory.get(member.guild.id);
        const Items = ItemsFactory.get(member.guild.id);

        const search = options.getString("search", false);
        if (search) {
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle(`${search}`);

            const command = await Commands.get(search);
            if (command) {
                const { description, options } = command.metadata as SlashCommandBuilder;
                const adminSpecifier: string = command.is_admin ? " (admin)" : "";
                options.forEach(option => {
                    const data = option as unknown as APIApplicationCommandOption;
                    embed.addFields({
                        name: `${data.name} ${data.required ? "(required)" : ""}`,
                        value: data.description,
                    });
                });
                embed.setDescription(`${description} ${adminSpecifier}`);
                return embed;
            }

            const item = await Items.get(search);
            if (item) {
                const { description, options } = item.metadata as SlashCommandSubcommandBuilder;
                options.forEach(option => {
                    const data = option as unknown as APIApplicationCommandOption;
                    embed.addFields({
                        name: `${data.name} ${data.required ? "(required)" : ""}`,
                        value: data.description,
                    });
                });
                embed.setDescription(`${description}`);
                return embed;
            }

            throw new Error("This item or command does not exist.");
        } else {
            const pageNum = options.getNumber("page", false) || 1;
            return sendHelpMenu(member, HELP_ID, HELP_PAGE_SIZE, pageNum);
        }
    },
};

async function sendHelpMenu(
    member: GuildMember,
    id: string,
    pageSize: number = 5,
    pageNum: number = 1,
): Promise<InteractionReplyOptions> {
    const Commands = CommandsFactory.get(member.guild.id);

    const startIndex: number = (pageNum - 1) * pageSize;
    const endIndex: number = startIndex + pageSize;
    const commands = await Commands.getAll();
    const slicedCommands = commands.slice(startIndex, endIndex);

    const totalPages = Math.ceil(commands.length / pageSize);
    const paginatedMenu = new PaginatedMenuBuilder(
        id,
        pageSize,
        pageNum,
        totalPages,
    )
        .setColor("Blurple")
        .setTitle("Commands")
        .setDescription(
            `${buildUsageTag(data.metadata as SlashCommandBuilder)} for more info on a command/item's usage`,
        );

    slicedCommands.forEach((command) => {
        const adminSpecifier: string = command.is_admin ? " (admin)" : "";
        const metadata = command.metadata as SlashCommandBuilder;
        paginatedMenu.addFields({
            name: `${command.command_id}${adminSpecifier}`,
            value: `${metadata.description}\n${buildUsageTag(metadata)}`,
        });
    });

    const embed = paginatedMenu.createEmbed();
    const buttons = paginatedMenu.createButtons();
    return { embeds: [embed], components: [buttons] };
}

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isButton()) {
            return;
        }

        const { customId } = interaction;

        if (![`${HELP_ID}Previous`, `${HELP_ID}Next`].includes(customId))
            return;

        let pageNum = parseInt(
            interaction.message.embeds[0].description.match(/Page (\d+)/)[1],
        );
        pageNum =
            customId === `${HELP_ID}Previous`
                ? (pageNum = Math.max(pageNum - 1, 1))
                : pageNum + 1;

        const reply = await sendHelpMenu(interaction.message.member, HELP_ID, HELP_PAGE_SIZE, pageNum);
        await interaction.update({
          embeds: reply.embeds,
          components: reply.components,
        });
    } catch (error) {
        console.error(error);
    }
});
