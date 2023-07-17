const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { tendieIconCode } = require("../../utilities.js");
const { client } = require("../../index.js");

module.exports = {
	data: {
        name: 'shop',
        description: 'View the shop.'
    },
	async execute(message, args) {
        handleShopReply(message, args);
    },
};

async function handleShopReply(message, args, isUpdate) {
    let pageNum = args.find(arg => !isNaN(arg)) ?? 1;
    const pageSize = 5;
    const startIndex = (pageNum - 1) * pageSize;
    const endIndex = startIndex + pageSize;


    const items = Array.from(message.client.items.values())
        .sort((itemA, itemB) => itemA.data.price - itemB.data.price)
        .slice(startIndex, endIndex + 1);

    const totalPages = Math.ceil(items.length / pageSize);

    const roles = [
        "Truecel",
        "Incel",
        "Chud",
        "Fakecel",
        "Normie"
    ];

    const embed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle("Shop")
        .setDescription(`Page ${pageNum}/${totalPages}\n----\nTo view additional info on an item, see $help [item].\n----\n`);

    items.forEach(item => {
        embed.addFields({ name: `${item.data.icon} ${item.data.name} - ${tendieIconCode} - ${item.data.price} (${roles[item.data.role]})`, value: `${item.data.description}` });
    })

    if (pageNum > totalPages || pageNum < 1) return;

    const previousBtn = new ButtonBuilder()
        .setCustomId('shopPrevious')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageNum == 1);

    const nextBtn = new ButtonBuilder()
        .setCustomId('shopNext')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageNum == totalPages);

    const buttons = new ActionRowBuilder()
        .addComponents(previousBtn, nextBtn);

    if (isUpdate) {
        return message.update({ embeds: [embed], components: [buttons] });
    } else {
        return message.reply({ embeds: [embed], components: [buttons] });
    }
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const { customId } = interaction;

    if (!['shopPrevious', 'shopNext'].includes(customId)) return;

    const authorId = interaction.message.mentions.users.first().id;

    if (interaction.user.id !== authorId) return;

    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);

    if (customId === 'shopPrevious') {
        pageNum = Math.max(pageNum - 1, 1);
    } else if (customId === 'shopNext') {
        pageNum = pageNum + 1;
    }

    if (authorId === interaction.user.id) {
        handleShopReply(interaction, [pageNum], true);
    }
});
