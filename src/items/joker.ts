// const { getRandomInt } = require("../utilities.js");

// function getRandomNick(){
//     const words = ['nigger', 'cunt', 'lovely', 'jew', 'horny', 'spectacular', 'retarded', 'large', 'sympathizer',
//         'mmm', 'benis', 'sweet', 'drunk', 'fat', 'loser', 'cunny', 'd1ck', 'giant', 'smol', 'goyim', 'obese',
//         'hairy', 'lover', 'enjoyer', 'giga', 'virgin', 'chad', 'chud', 'vancepilled', 'bluepilled', 'schizo', 'incel'];
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

// module.exports = {
//     data: {
//         name: 'joker',
//         price: 5000,
//         icon: ":black_joker:",
//         description: "???",
//         usage: "$use joker",
//         role: 3
//     },
//     async use(message, args) {
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
