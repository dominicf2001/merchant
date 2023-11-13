"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const utilities_1 = require("../utilities");
const data = {
    item_id: 'megaphone',
    price: 20000,
    emoji_code: ":mega:",
    description: "Sends your message and/or attachment as an @everyone",
    usage: `${(0, discord_js_1.inlineCode)("$use megaphone [message/attachment]")}\n${(0, discord_js_1.inlineCode)("$use megaphone [message] [attachment]")}`
};
exports.default = {
    data: data,
    async use(message, args) {
        const msgToSend = (0, utilities_1.findTextArgs)(args).join(" ");
        const attachmentsArray = [...message.attachments.values()];
        if (!msgToSend && message.attachments.size === 0) {
            throw new Error("You need to provide a message or an attachment.");
        }
        await message.delete();
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Blurple")
            .setFields({
            name: `${msgToSend}`,
            value: `${(0, discord_js_1.inlineCode)('-')} <@${message.author.id}>`
        });
        await message.channel.send({ content: '@everyone', embeds: [embed], files: attachmentsArray, });
    }
};
