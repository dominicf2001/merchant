// const { getRandomInt } = require("../utilities.js");
// import { Message, inlineCode } from "discord.js";
// import { Items as Item, ItemsItemId } from '../database/schemas/public/Items';

// function getRandomNick(){
//     words = [];
//     let newNickname = "";

//     for (var i = 0; i < getRandomInt(1, 6); ++i){
//         let newWord = words[getRandomInt(0, words.length)];
//         if ((newNickname.length + newWord.length) <= 32) {
//             newNickname += newWord + ' ';
//         } else {
//             break;
//         }
//     }
//     return newNickname;
// }

// const data: Item = {
//     item_id: 'joker' as ItemsItemId,
//     price: 5000,
//     emoji_code: ":black_joker:",
//     description: "???",
//     usage: `${inlineCode("$use joker")}`
// };

// export default {
//     data: data,
//     async use(message: Message, args: string[]): Promise<void> {
//         let members;
//         try {
//             members = await message.guild.members.fetch();
//         } catch (error) {
//             throw new Error("I couldn't fetch the member list!");
//         }

//         message.channel.send(`All user nicknames have been changed`);
//         for (let [id, member] of members) {
//             if (!member.user.bot) {
//                 try {
//                     let newNickname = getRandomNick();
//                     await member.setNickname(newNickname);
//                 } catch (error) {
//                     console.error(`Failed to change nickname for member ${id}:`, error);
//                 }
//             }
//         }
//     }
// }
