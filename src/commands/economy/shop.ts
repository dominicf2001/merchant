import { Items } from '../../database/db-objects';
import { CURRENCY_EMOJI_CODE, formatNumber, findNumericArgs, PaginatedMenuBuilder } from '../../utilities';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { Message, Events, ButtonInteraction, inlineCode } from 'discord.js';
import { client } from '../../index';

const SHOP_ID: string = 'shop';
const SHOP_PAGE_SIZE: number = 5;

const data: Command = {
    command_id: 'shop' as CommandsCommandId,
    description: `View the shop`,
    usage: `${inlineCode("$shop")}`,
    cooldown_time: 0,
    is_admin: false
};

export default {
    data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        try {
            const pageNum = +findNumericArgs(args)[0] || 1;
            await sendShopMenu(message, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when getting the shop. Please try again later.');
        }
    }
};

// TODO: abstract this?
async function sendShopMenu(message: Message | ButtonInteraction, id: string, pageSize: number = 5, pageNum: number = 1): Promise<void> {
    const startIndex: number = (pageNum - 1) * pageSize;
    const endIndex: number = startIndex + pageSize;
    const items = await Items.getAll();
    const slicedItems = items
        .sort((itemA, itemB) => itemA.price - itemB.price)
        .slice(startIndex, endIndex);

    const totalPages = Math.ceil(items.length / pageSize);
    const paginatedMenu = new PaginatedMenuBuilder(id, pageSize, pageNum, totalPages)
        .setColor('Blurple')
        .setTitle('Shop')
        .setDescription(`To view additional info on an item, see ${inlineCode("$help [item]")}.`);
    
    slicedItems.forEach(item => {
        paginatedMenu.addFields({ name: `${item.emoji_code} ${item.item_id} - ${CURRENCY_EMOJI_CODE} - ${formatNumber(item.price)}`, value: `${item.description}` });
    });

    const embed = paginatedMenu.createEmbed();
    const buttons = paginatedMenu.createButtons();
    
    message instanceof ButtonInteraction ?
        await message.update({ embeds: [embed], components: [buttons] }) :
        await message.reply({ embeds: [embed], components: [buttons] });
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) {
        return;
    }
    
    const { customId } = interaction;

    if (![`${SHOP_ID}Previous`, `${SHOP_ID}Next`].includes(customId))
        return;

    const authorId = interaction.message.mentions.users.first().id;
    if (interaction.user.id !== authorId)
        return;

    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
    pageNum = (customId === `${SHOP_ID}Previous`) ?
        pageNum = Math.max(pageNum - 1, 1) :
        pageNum + 1;
    
    await sendShopMenu(interaction, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
});
