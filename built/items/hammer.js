// const blacklist = {
//     "992276497912049785": 1,
//     "1132451468750893199": 2,
//     "1132450703495942184": 3,
//     "1132458132044533800": 4,
//     "1132449807894585466": 5,
//     "992277426392539206": 6,
//     "992277557334528060": 7,
//     "1132450409810759691": 8,
//     "1132450460494733342": 9,
//     "1028086642675818596": 10,
//     "1019786911407161386": 11,
//     "1132450487204057129": 12,
//     "1132450501498241054": 13,
//     "1132452564592492544": 14,
//     "992277222352240762": 15,
//     "992277306267676732": 16,
//     "1132452681110278144": 17
// };
// module.exports = {
//     data: {
//         name: 'hammer',
//         price: 3000,
//         icon: ":hammer:",
//         description: "Destroys a channel or emoji.",
//         usage: "$use hammer [channel/emoji] [name]",
//         role: 3
//     },
//     async use(message, args) {
//         const hammerObject = args[0];
//         const hammerArgs = args.filter(arg => arg !== hammerObject);
//         if (!hammerObject) {
//             throw new Error('Please specify a hammer object. See $help hammer for options.');
//         }
//         try {
//             switch (hammerObject) {
//                 case "emoji":
//                     const emojiName = hammerArgs.join(" ");
//                     const emojiId = (await message.guild.emojis.fetch())
//                         .findKey(emoji => emoji.name == emojiName);
//                     await message.guild.emojis.delete(emojiId);
//                     message.channel.send(`${emojiName} has been demolished.`);
//                     break;
//                 case "channel":
//                     const channelName = hammerArgs.join(" ");
//                     const channel = (await message.guild.channels.fetch())
//                         .find(channel => channel.name == channelName);
//                     if (blacklist[channel.parentId]){
//                         throw new Error('This channel cannot be deleted.');
//                     }
//                     const channelId = channel.id;
//                     await message.guild.channels.delete(channelId);
//                     message.channel.send(`${channelName} has been demolished.`);
//                     break;
//                 default:
//                     throw new Error('Invalid hammer object.');
//             }
//         } catch (error) {
//             console.error(error);
//             throw new Error("Hammer error. Make sure that channel or emoji exists.");
//         }
//     }
// }
