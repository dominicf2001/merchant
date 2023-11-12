// import { Message, inlineCode } from "discord.js";
// import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';

// const data: Item = {
//     item_id: 'wrench' as ItemsItemId,
//     price: 4000,
//     emoji_code: ":wrench:",
//     description: "Creates a new channel or emoji",
//     usage: `${inlineCode("$use wrench [channel/emoji] [name] [attachment (emoji only)]")}`
// };

// export default {
//     data: data,
//     async use(message: Message, args: string[]): Promise<void> {
//         const wrenchObject = args[0];
//         const wrenchArgs = args.filter(arg => arg !== wrenchObject);

//         if (!wrenchObject) {
//             throw new Error('Please specify a wrench object. See $help wrench for options.');
//         }

//         try {
//             switch (wrenchObject) {
//                 case "emoji":
//                     const emojiUrl = message.attachments.first()["url"];
//                     const emojiName = wrenchArgs.join(" ");
//                     await message.guild.emojis.create({
//                         attachment: emojiUrl,
//                         name: emojiName
//                     });
//                     message.channel.send("A new emoji has been constructed.");
//                     break;
//                 case "channel":
//                     console.log(message.mentions.channels.first());
//                     const newChannelName = wrenchArgs.join(" ");
//                     await message.guild.channels.create({ name: newChannelName, parent: "608853914535854102" });
//                     message.channel.send("A new channel has been constructed.");
//                     break;
//                 default:
//                     throw new Error('Invalid wrench object.');
//             }
//         } catch (error) {
//             console.error(error);
//             throw new Error("Wrench error. Try adjusting the image size or name length.");
//         }
//     }
// }
