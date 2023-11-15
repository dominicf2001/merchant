"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = require("discord.js");
const db_objects_1 = require("./database/db-objects");
const stock_utilities_1 = require("./stock-utilities");
const { TOKEN } = JSON.parse(fs_1.default.readFileSync(`${__dirname}/../token.json`, 'utf8'));
const utilities_1 = require("./utilities");
// import { calculateAndUpdateStocks, stockCleanUp } from "./cron";
exports.client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.GuildInvites,
        discord_js_1.GatewayIntentBits.GuildModeration,
        discord_js_1.GatewayIntentBits.GuildIntegrations,
        discord_js_1.GatewayIntentBits.GuildPresences
    ],
});
exports.client.once(discord_js_1.Events.ClientReady, async () => {
    console.log('Ready as ' + exports.client.user.tag);
});
exports.client.on(discord_js_1.Events.InviteCreate, async (invite) => {
    if (invite.inviter.bot)
        return;
    if ((0, utilities_1.marketIsOpen)()) {
        await db_objects_1.Users.addActivityPoints(invite.inviterId, utilities_1.INVITE_ACTIVITY_VALUE);
    }
});
exports.client.on(discord_js_1.Events.MessageReactionAdd, async (_, user) => {
    if (user.bot)
        return;
    if ((0, utilities_1.marketIsOpen)()) {
        await db_objects_1.Users.addActivityPoints(user.id, utilities_1.REACTION_ACTIVITY_VALUE);
    }
});
exports.client.on(discord_js_1.Events.VoiceStateUpdate, async (oldState, newState) => {
    if (oldState.channel || !newState.channel || newState.member.user.bot)
        return;
    if ((0, utilities_1.marketIsOpen)()) {
        await db_objects_1.Users.addActivityPoints(newState.member.user.id, utilities_1.VOICE_ACTIVITY_VALUE);
    }
});
// COMMAND HANDLING
exports.client.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.author.bot)
        return;
    const userExists = !!db_objects_1.Users.get(message.author.id);
    if (!userExists) {
        await db_objects_1.Users.set(message.author.id);
    }
    const prefix = '$';
    const isCommand = message.content.startsWith(prefix);
    // When a command is called
    if (isCommand) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = await db_objects_1.Commands.get(commandName);
        if (!command)
            return;
        if (command.is_admin && message.member.moderatable) {
            await message.reply("You do not have permission to use this command.");
            return;
        }
        // Check for remaining cooldown
        const remainingCooldownDuration = await db_objects_1.Users.getRemainingCooldownDuration(message.author.id, commandName);
        if (remainingCooldownDuration > 0) {
            await message.reply({ content: `Please wait, you are on a cooldown for \`${command.command_id}\`. You can use it again in \`${(0, utilities_1.secondsToHms)(remainingCooldownDuration / 1000)}\`.` });
            return;
        }
        // If no cooldown, execute command and set cooldown
        await db_objects_1.Commands.execute(command.command_id, message, args);
        if (command.cooldown_time > 0) {
            await db_objects_1.Users.createCooldown(message.author.id, command.command_id);
        }
    }
    else {
        // HANDLE USER ACTIVITY POINTS UPDATING, author and mentions
        if ((0, utilities_1.marketIsOpen)()) {
            const mentionedUsers = message.mentions.users;
            mentionedUsers.forEach(async (user) => {
                if (user.id != message.author.id && !user.bot) {
                    await db_objects_1.Users.addActivityPoints(user.id, utilities_1.MENTIONED_ACTIVITY_VALUE);
                }
            });
            await db_objects_1.Users.addActivityPoints(message.author.id, utilities_1.MESSAGE_ACTIVITY_VALUE);
        }
    }
});
// CRON HANDLING
let stockTicker = node_cron_1.default.schedule(`*/5 ${utilities_1.OPEN_HOUR}-${utilities_1.CLOSE_HOUR} * * *`, () => {
    // update prices at a random minute within the next 5 minutes
    let randomMinute = Math.floor(Math.random() * 5);
    setTimeout(async () => {
        await (0, stock_utilities_1.updateStockPrices)();
        // TODO: paramaterize channel id or turn into command
        const channel = await exports.client.channels.fetch("1119995339349430423");
        if (channel.isTextBased()) {
            await channel.send('Stocks ticked');
        }
    }, randomMinute * 60 * 1000);
}, {
    timezone: utilities_1.TIMEZONE
});
// TODO
let dailyCleanup = node_cron_1.default.schedule('0 5 * * *', () => {
    // stockCleanUp();
    console.log("Cleanup has occurred!");
}, {
    timezone: utilities_1.TIMEZONE
});
stockTicker.start();
// dailyCleanup.start();
exports.client.login(TOKEN);
