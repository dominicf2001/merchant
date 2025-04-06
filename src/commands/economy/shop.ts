import { ItemsFactory } from "../../database/db-objects";
import {
    CURRENCY_EMOJI_CODE,
    formatNumber,
    PaginatedMenuBuilder,
    client,
    CommandOptions,
    CommandResponse
} from "../../utilities";
import {
    Commands as Command,
    CommandsCommandId,
} from "../../database/schemas/public/Commands";
import { Events, inlineCode, SlashCommandBuilder, GuildMember, InteractionReplyOptions } from "discord.js";
import { CommandObj } from "src/database/datastores/Commands";

const SHOP_ID: string = "shop";
const SHOP_PAGE_SIZE: number = 5;

const data: Partial<Command> = {
    command_id: "shop" as CommandsCommandId,
    metadata: new SlashCommandBuilder()
        .setName("shop")
        .setDescription("View the shop")
        .addNumberOption(o => o
            .setName("page")
            .setDescription("the shop page you want to view")),
    cooldown_time: 0,
    is_admin: false,
};

export default <CommandObj>{
    data,
    async execute(member: GuildMember, options: CommandOptions): Promise<CommandResponse> {
        const pageNum = options.getNumber("page", false) || 1;
        return sendShopMenu(member, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
    },
};

// TODO: abstract this?
async function sendShopMenu(
    member: GuildMember,
    id: string,
    pageSize: number = 5,
    pageNum: number = 1,
): Promise<InteractionReplyOptions> {
    const Items = ItemsFactory.get(member.guild.id);

    const startIndex: number = (pageNum - 1) * pageSize;
    const endIndex: number = startIndex + pageSize;
    const items = await Items.getAll();
    const slicedItems = items
        .sort((itemA, itemB) => itemA.price - itemB.price)
        .slice(startIndex, endIndex);

    const totalPages = Math.ceil(items.length / pageSize);
    const paginatedMenu = new PaginatedMenuBuilder(
        id,
        pageSize,
        pageNum,
        totalPages,
    )
        .setColor("Blurple")
        .setTitle("Shop")
        .setDescription(
            `To view additional info on an item, see ${inlineCode("/help [item]")}.`,
        );

    slicedItems.forEach((item) => {
        const metadata = item.metadata as unknown as SlashCommandBuilder
        paginatedMenu.addFields({
            name: `${item.emoji_code} ${item.item_id} - ${CURRENCY_EMOJI_CODE} - ${formatNumber(item.price)}`,
            value: `${metadata.description}`,
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

        if (![`${SHOP_ID}Previous`, `${SHOP_ID}Next`].includes(customId))
            return;

        let pageNum = parseInt(
            interaction.message.embeds[0].description.match(/Page (\d+)/)[1],
        );
        pageNum =
            customId === `${SHOP_ID}Previous`
                ? (pageNum = Math.max(pageNum - 1, 1))
                : pageNum + 1;

        const reply = await sendShopMenu(interaction.message.member, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
        await interaction.update({
            embeds: reply.embeds,
            components: reply.components,
        });
    } catch (error) {
        console.error(error);
    }
});
