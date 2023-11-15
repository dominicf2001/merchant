"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_objects_1 = require("../../database/db-objects");
const utilities_1 = require("../../utilities");
const discord_js_1 = require("discord.js");
var RobType;
(function (RobType) {
    RobType["tendies"] = "tendies";
    RobType["item"] = "item";
})(RobType || (RobType = {}));
function isValidRobType(robType) {
    return Object.keys(RobType).includes(robType);
}
const data = {
    command_id: 'rob',
    description: `Rob user of tendies or a random item with a chance of failure + fine`,
    usage: `${(0, discord_js_1.inlineCode)("$rob [@user] [tendies/item]")}`,
    cooldown_time: 5000,
    is_admin: false
};
exports.default = {
    data: data,
    async execute(message, args) {
        try {
            const robType = ((0, utilities_1.findTextArgs)(args)[0] ?? 'tendies');
            const target = message.mentions.users.first();
            // if (author.role < 1) throw new Error(`Your role is too low to use this command. Minimum role is: ${inlineCode("Fakecel")}`);
            if (!target) {
                await message.reply("Please specify a target.");
                return;
            }
            if (target.id === message.author.id) {
                await message.reply("You cannot rob yourself.");
                return;
            }
            if (!isValidRobType(robType)) {
                await message.reply("Invalid rob type.");
                return;
            }
            let reply = "";
            switch (robType) {
                case 'tendies':
                    if ((0, utilities_1.getRandomInt)(1, 100) >= utilities_1.CURRENCY_ROB_CHANCE) {
                        const targetBalance = await db_objects_1.Users.getBalance(target.id);
                        const robAmount = Math.floor(targetBalance * (utilities_1.CURRENCY_ROB_PERCENTAGE / 100));
                        await db_objects_1.Users.addBalance(message.author.id, robAmount);
                        await db_objects_1.Users.addBalance(target.id, -robAmount);
                        reply = `You have robbed ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(robAmount)} from: ${(0, discord_js_1.inlineCode)(target.username)}.`;
                    }
                    else {
                        const authorBalance = await db_objects_1.Users.getBalance(message.author.id);
                        const penaltyAmount = Math.floor(authorBalance * (utilities_1.CURRENCY_FINE_PERCENTAGE / 100));
                        await db_objects_1.Users.addBalance(message.author.id, -penaltyAmount);
                        reply = `You failed at robbing ${(0, discord_js_1.inlineCode)(target.username)}. You have been fined ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(penaltyAmount)} `;
                    }
                    break;
                case 'item':
                    if ((0, utilities_1.getRandomInt)(1, 100) >= utilities_1.ITEM_ROB_CHANCE) {
                        const targetItems = await db_objects_1.Users.getItems(target.id);
                        const authorItemCount = await db_objects_1.Users.getItemCount(message.author.id);
                        if (authorItemCount >= utilities_1.MAX_INV_SIZE) {
                            await message.reply("Your inventory is full.");
                            return;
                        }
                        if (!targetItems.length) {
                            await message.reply("This user has no items.");
                            return;
                        }
                        const item = targetItems[Math.floor(Math.random() * targetItems.length)];
                        await db_objects_1.Users.addItem(target.id, item.item_id, -1);
                        await db_objects_1.Users.addItem(message.author.id, item.item_id, 1);
                        reply = `You have robbed ${item.item_id} from: ${(0, discord_js_1.inlineCode)(target.username)}.`;
                    }
                    else {
                        const authorBalance = await db_objects_1.Users.getBalance(message.author.id);
                        const penaltyAmount = Math.floor(authorBalance * (utilities_1.ITEM_FINE_PERCENTAGE / 100));
                        await db_objects_1.Users.addBalance(message.author.id, -penaltyAmount);
                        reply = `You failed at robbing ${(0, discord_js_1.inlineCode)(target.username)}. You have been fined ${utilities_1.CURRENCY_EMOJI_CODE} ${(0, utilities_1.formatNumber)(penaltyAmount)} `;
                    }
                    break;
            }
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Blurple")
                .setFields({
                name: reply,
                value: ` `
            });
            await message.reply({ embeds: [embed] });
        }
        catch (error) {
            console.error(error);
            await message.reply('An error occurred when robbing. Please try again later.');
        }
    }
};
