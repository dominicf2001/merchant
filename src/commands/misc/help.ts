import { CommandsFactory, ItemsFactory } from "../../database/db-objects";
import {
    PaginatedMenuBuilder,
    findTextArgs,
    findNumericArgs,
    client,
} from "../../utilities";
import {
    Message,
    Events,
    ButtonInteraction,
    EmbedBuilder,
    inlineCode,
    SlashCommandBuilder,
    ApplicationCommandOptionType,
    APIApplicationCommandOption,
    GuildMember,
} from "discord.js";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { CommandOptions, CommandResponse } from "src/command-utilities";

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

const buildUsageTag = (metadata: SlashCommandBuilder) => {
  const options = metadata.options.map(option => {
    const data = option as unknown as APIApplicationCommandOption;
    let prefix = "";
    switch (data.type) {
      case ApplicationCommandOptionType.User: prefix = "@"; break;
      case ApplicationCommandOptionType.Number: prefix = "#"; break;
    }
    return data.required ? `[${prefix}${data.name}]` : `(${prefix}${data.name})`;
  })
  return inlineCode(`${metadata.name} ${options.join(" ")}`)
}

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
            const metadata = command.metadata as SlashCommandBuilder;

            if (command) {
                const adminSpecifier: string = command.is_admin
                    ? " (admin)"
                    : "";

                embed.addFields({
                    name: `${command.command_id}${adminSpecifier}`,
                    value: ` `,
                });
                embed.setDescription(`${metadata.description}`);
                return embed;
            }

            const item = await Items.get(search);

            if (item) {
                embed.addFields({
                    name: `${item.item_id}`,
                    value: ` `,
                });
                embed.setDescription(`${item.description}`);
                return embed;
            }

            throw new Error("This item or command does not exist.");
        } else {
            const pageNum = options.getNumber("page", false) || 1;
            await sendHelpMenu(message, HELP_ID, HELP_PAGE_SIZE, pageNum);
        }
    },
};

async function sendHelpMenu(
    message: Message | ButtonInteraction,
    id: string,
    pageSize: number = 5,
    pageNum: number = 1,
): Promise<void> {
    const Commands = CommandsFactory.get(message.guildId);

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
            `${inlineCode("$help [command/item]")} for more info on a command/item's usage`,
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

    message instanceof ButtonInteraction
        ? await message.update({ embeds: [embed], components: [buttons] })
        : await message.reply({ embeds: [embed], components: [buttons] });
}

client.on(Events.InteractionCreate, async (interaction) => {
    try {
        if (!interaction.isButton()) {
            return;
        }

        const { customId } = interaction;

        if (![`${HELP_ID}Previous`, `${HELP_ID}Next`].includes(customId))
            return;

        const authorId = interaction.message.mentions.users.first().id;
        if (interaction.user.id !== authorId) return;

        let pageNum = parseInt(
            interaction.message.embeds[0].description.match(/Page (\d+)/)[1],
        );
        pageNum =
            customId === `${HELP_ID}Previous`
                ? (pageNum = Math.max(pageNum - 1, 1))
                : pageNum + 1;

        await sendHelpMenu(interaction, HELP_ID, HELP_PAGE_SIZE, pageNum);
    } catch (error) {
        console.error(error);
    }
});
