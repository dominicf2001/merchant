// import { Message, inlineCode } from "discord.js";
// import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';
// const data: Item = {
//     item_id: 'battery' as ItemsItemId,
//     price: 500,
//     emoji_code: ":battery:",
//     description: "Enables nexxy",
//     usage: `${inlineCode("$use battery")}`
// }
// export default {
//     data: data,
//     async use(message: Message, args: string[]): Promise<void> {
//         let target;
//         try {
//             target = await message.guild.members.fetch("1030224702939070494");
//         } catch (error) {
//             throw new Error(`Couldn't fetch user with id: ${"1030224702939070494"}`);
//         }
//         try {
// 	        target.timeout(null);
//             message.channel.send(`<@${target.id}> has been enabled. Use the emp to disable her again!`);
//         } catch (error) {
//             throw new Error('Error enabling nexxy.');
//         }
//     }
// }
