// // const { updateUserRoleLevel } = require("../../database/utilities/userUtilities.js");
// import { EmbedBuilder, inlineCode } from 'discord.js';
// import { Users } from '@database';
// // const { updateRoles } = require("../../rolesCron.js");

// module.exports = {
// 	data: {
//         name: 'setrole',
//         description: `(ADMIN) Set a users balance.\n${inlineCode("$addbalance @target amount")}`
//     },
// 	async execute(message: Message, args: string[]): Promise<void> {
//         if (message.author.id != "608852453315837964") {
//             await message.reply("You do not have permission to use this.");
//             return;
//         }

//         const targetArg = args.filter(arg => arg.startsWith('<@') && arg.endsWith('>'))[0];
// 		let newRole = args.find(arg => isNaN(arg) && !arg.startsWith('<@') && !arg.endsWith('>'));

//         if (!newRole) {
//             await message.reply("You must specify a role.");
//             return;
//         };

//         newRole = newRole.charAt(0).toUpperCase() + newRole.slice(1);

//         if (!targetArg) {
//             await message.reply('Please specify a target.');
//             return;
//         }

//         let id = targetArg.slice(2, -1);

//         if (id.startsWith('!')) {
//             id = id.slice(1);
//         }

//         const target = await Users.findOne({ where: { user_id: id } });

//         if (!target) {
//             await message.reply('Invalid target specified.');
//             return;
//         }

//         if (!target) {
//             await message.reply("You must specify a target.");
//             return;
//         }

//         const guild = client.guilds.cache.get("608853914535854101");

//         updateUserRoleLevel(guild, target, newRole);

//         const embed = new EmbedBuilder()
//             .setColor("Blurple")
//             .setFields({
//                 name: `Role set to: ${newRole}`,
//                 value: ` `
//             });

//         await message.reply({ embeds: [embed] });
//     }
// }
