"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { getRandomInt } = require("../utilities.js");
const discord_js_1 = require("discord.js");
function getRandomNick() {
    const words = ['nigger', 'cunt', 'lovely', 'jew', 'horny', 'spectacular', 'retarded', 'large', 'sympathizer',
        'mmm', 'benis', 'sweet', 'drunk', 'fat', 'loser', 'cunny', 'd1ck', 'giant', 'smol', 'goyim', 'obese',
        'hairy', 'lover', 'enjoyer', 'giga', 'virgin', 'chad', 'chud', 'vancepilled', 'bluepilled', 'schizo', 'incel'];
    let newNickname = "";
    for (var i = 0; i < getRandomInt(1, 6); ++i) {
        let newWord = words[getRandomInt(0, words.length)];
        if ((newNickname.length + newWord.length) <= 32) {
            newNickname += newWord + ' ';
        }
        else {
            break;
        }
    }
    return newNickname;
}
const data = {
    item_id: 'joker',
    price: 5000,
    emoji_code: ":black_joker:",
    description: "???",
    usage: `${(0, discord_js_1.inlineCode)("$use joker")}`
};
exports.default = {
    data: data,
    async use(message, args) {
        let members;
        try {
            members = await message.guild.members.fetch();
        }
        catch (error) {
            throw new Error("I couldn't fetch the member list!");
        }
        message.channel.send(`All user nicknames have been changed`);
        for (let [id, member] of members) {
            if (!member.user.bot) {
                try {
                    let newNickname = getRandomNick();
                    await member.setNickname(newNickname);
                }
                catch (error) {
                    console.error(`Failed to change nickname for member ${id}:`, error);
                }
            }
        }
    }
};
