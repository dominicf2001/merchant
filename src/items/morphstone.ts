// import { EmbedBuilder, Message, inlineCode } from "discord.js";
// import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';

// const data: Item = {
//     item_id: 'morphstone' as ItemsItemId,
//     price: 5000,
//     emoji_code: ":rock:",
//     description: "Allows you to set the server name, banner, icon or channel name",
//     usage: `${inlineCode("$use morphstone [name/channel/icon/banner] [name/attachment]")}`
// };

// export default {
//     data: data,
//     async use(message: Message, args: string[]): Promise<void> {
//         const morphObject = args[0];
//         const morphArgs = args.filter(arg => arg !== morphObject);

//         if (!morphObject) {
//             throw new Error('Please specify a morph object. See $help morphstone for options.');
//         }

//         try {
//             switch (morphObject) {
//                 case "icon":
//                     const iconUrl = message.attachments.first()["url"];
//                     await message.guild.setIcon(iconUrl);
//                     message.channel.send("Server icon has been morphed.");
//                     break;
//                 case "name":
//                     const newServerName = morphArgs.join(" ");
//                     message.guild.setName(newServerName);
//                     message.channel.send("Server name has been morphed.");
//                     break;
//                 case "banner":
//                     const bannerUrl = message.attachments.first()["url"];
//                     await message.guild.setBanner(bannerUrl);
//                     message.channel.send("Server banner has been morphed.");
//                     break;
//                 case "channel":
//                     const channelId = message.channelId;
//                     const newChannelName = morphArgs.join(" ");
//                     await message.guild.channels.edit(channelId, { name: newChannelName });
//                     message.channel.send("Channel name has been morphed.");
//                     break;
//                 default:
//                     throw new Error('Invalid morph object.');
//             }
//         } catch (error) {
//             console.error(error);
//             throw new Error("Morphing error. Try adjusting the image size or name length.");
//         }
//     }
// }
