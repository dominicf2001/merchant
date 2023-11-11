import { Commands, Items } from '../../database/db-objects';
import { PaginatedMenuBuilder, findTextArgs, findNumericArgs } from '../../utilities';
import { Message, Events, ButtonInteraction, EmbedBuilder } from 'discord.js';
import { Commands as Command, CommandsCommandId } from '../../database/schemas/public/Commands';
import { client } from '../../index';

const HELP_ID: string = 'help';
const HELP_PAGE_SIZE: number = 5;

const data: Command = {
    command_id: 'help' as CommandsCommandId,
    description: `Displays available commands or displays info on a command/item.`,
    cooldown_time: 0,
    is_admin: false
};

// TODO: implement paging
export default {
	data: data,
    async execute(message: Message, args: string[]): Promise<void> {
        if (args.length){
            const name = findTextArgs(args)[0].toLowerCase();
            const embed = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle(`${name}`);

            const command = await Commands.get(name);

            if (command) {
                embed.addFields({
                    name: `${command.command_id}`,
                    value: ` `
                });
                embed.setDescription(`${command.description}`);
                await message.reply({ embeds: [embed] });
                return;
            }


            const item = await Items.get(name);
            
            if (item){
                embed.addFields({
                    name: `${item.item_id}`,
                    value: ` `
                });
                embed.setDescription(`${item.description}`);
                await message.reply({ embeds: [embed] });
                return;
            }

            await message.reply("This item or command does not exist.");

        } else {
            const pageNum = +findNumericArgs(args)[0] || 1;
            await sendHelpMenu(message, HELP_ID, HELP_PAGE_SIZE, pageNum);
        }
	},
};

async function sendHelpMenu(message: Message | ButtonInteraction, id: string, pageSize: number = 5, pageNum: number = 1): Promise<void> {
    const paginatedMenu = new PaginatedMenuBuilder(id, pageSize, pageNum)
        .setColor('Blurple')
        .setTitle('Commands')
        .setDescription("$help [command/item] for additional info on a specific command/item's usage");

    const startIndex: number = (pageNum - 1) * pageSize;
    const endIndex: number = startIndex + pageSize;
    const commands = (await Commands.getAll())
                         .filter(command => !command.is_admin)
                         .slice(startIndex, endIndex + 1);
    
    commands.forEach(command => {
        paginatedMenu.addFields({ name: `${command.command_id}`, value: `${command.description}` });
    }) 

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

    if (![`${HELP_ID}Previous`, `${HELP_ID}Next`].includes(customId))
        return;

    const authorId = interaction.message.mentions.users.first().id;
    if (interaction.user.id !== authorId)
        return;

    let pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
    pageNum = (customId === `${HELP_ID}Previous`) ?
        pageNum = Math.max(pageNum - 1, 1) :
        pageNum + 1;
    
    await sendHelpMenu(interaction, HELP_ID, HELP_PAGE_SIZE, pageNum);
});
