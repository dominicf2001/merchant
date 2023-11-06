import { Items } from '@database';
import { CURRENCY_EMOJI_CODE, formatNumber, findNumericArgs, PaginatedMenuBuilder } from '@utilities';
import { Message, Events, ButtonInteraction } from 'discord.js';

const SHOP_ID: string = 'shop';
const SHOP_PAGE_SIZE: number = 5;

module.exports = {
    data: {
        name: 'shop',
        description: 'View the shop.'
    },
    async execute(message: Message, args: string[]): Promise<void> {
        const pageNum = +findNumericArgs(args)[0] ?? 1;
        await sendShopMenu(message, SHOP_ID, SHOP_PAGE_SIZE, pageNum);
    }
};

client.on(Events.InteractionCreate, async (interaction: ButtonInteraction) => {
    const { customId } = interaction;
    
    // Ensure this a paginated menu button (may need more checks here in the future)
    if (!interaction.isButton())
        return false;

    if (![`${SHOP_ID}Previous`, `${SHOP_ID}Next`].includes(customId))
        return;

    const authorId = interaction.message.mentions.users.first().id;
    if (interaction.user.id !== authorId)
        return;

    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
    pageNum = (customId === `${SHOP_ID}Previous`) ?
        pageNum = Math.max(pageNum - 1, 1) :
        pageNum + 1;
    
    await sendShopMenu(interaction, SHOP_ID, SHOP_PAGE_SIZE);
});

async function sendShopMenu(message: Message | ButtonInteraction, id: string, pageSize: number = 5, pageNum: number = 1): Promise<void> {
    const paginatedMenu = new PaginatedMenuBuilder(id)
        .setColor('Blurple')
        .setTitle('Shop')
        .setDescription('To view additional info on an item, see $help [item].');

    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const items = (await Items.getItems())
        .sort((itemA, itemB) => itemA.price - itemB.price)
        .slice(startIndex, endIndex + 1);
    
    items.forEach(item => {
        paginatedMenu.addFields({ name: `${item.emoji_code} ${item.item_id} - ${CURRENCY_EMOJI_CODE} - ${formatNumber(item.price)}`, value: `${item.description}` });
    }) 

    const embed = paginatedMenu.createEmbed();
    const buttons = paginatedMenu.createButtons();
    
    message instanceof ButtonInteraction ?
        await message.update({ embeds: [embed], components: [buttons] }) :
        await message.reply({ embeds: [embed], components: [buttons] });
}
