const { getBalance, addBalance, usersCache } = require("../../database/utilities/userUtilities.js");
const { tendieIconCode, formatNumber, getRandomInt, getRandomFloat } = require("../../utilities.js");
const { EmbedBuilder, inlineCode } = require('discord.js');
const { Users } = require("../../database/dbObjects.js");

module.exports = {
    cooldown: 5, // 7200
    data: {
        name: 'rob',
        description: `Rob a user of their tendies or a random item. Chance to fail and lose tendies.\n${inlineCode("$rob @target [tendies/item]")}`
    },
	async execute(message, args) {
		const robType = args.find(arg => isNaN(arg) && !arg.startsWith('<@') && !arg.endsWith('>')) ?? "tendies";
        const author = usersCache.get(message.author.id);
        if (author.role < 1) throw new Error(`Your role is too low to use this command. Minimum role is: ${inlineCode("Fakecel")}`);
		const target = message.mentions.users.first();

        if (!target){
            throw new Error("Please specify a target.");
        }

        if (target.id == author.user_id){
            throw new Error("You cannot rob yourself.");
        }

        if (robType !== "tendies" && robType !== "item") {
            throw new Error("Invalid rob type.");
        }

        let reply = "";

        if (robType == "tendies") {
            if (getRandomInt(1,100) > 70){
                const amount = getBalance(target.id) * getRandomFloat(.01, .10);
                addBalance(message.author.id, +amount);
                addBalance(target.id, -amount);
                reply = `You have robbed ${tendieIconCode} ${formatNumber(amount)} from: ${inlineCode(target.username)}.`;
            } else {
                const amount = getBalance(message.author.id) * getRandomFloat(.03, .15);
                addBalance(message.author.id, -amount);
                reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${tendieIconCode} ${formatNumber(amount)} `;
            }
        } else if (robType == "item") {
            if (getRandomInt(1,100) > 1){
                const targetUser = usersCache.get(target.id);
                const targetItems = await targetUser.getItems();
                const authorItems = await author.getItems();

                const userInvSize = authorItems.reduce((previous, current) => {
                    return previous + current["quantity"];
                }, 0);

                if (userInvSize >= 5) throw new Error("Your inventory is full.");

                if (!targetItems.length) throw new Error("This user has no items.");

                const item = targetItems[Math.floor(Math.random() * targetItems.length)];
                item.id = item.item_id;

                targetUser.removeItem(item);
                author.addItem(item);

                reply = `You have robbed ${item.item.name} from: ${inlineCode(target.username)}.`;
            } else {
                const amount = getBalance(message.author.id) * getRandomFloat(.03, .15);
                addBalance(message.author.id, -amount);
                reply = `You failed at robbing ${inlineCode(target.username)}. You have been fined ${tendieIconCode} ${formatNumber(amount)} `;
            }

        }

        const embed = new EmbedBuilder()
            .setColor("Blurple")
            .setFields({
                name: reply,
                value: ` `
            });

        return message.reply({ embeds: [embed] });
    },
}
