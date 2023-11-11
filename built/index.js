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
const { TOKEN } = JSON.parse(fs_1.default.readFileSync(`${__dirname}/../config.json`, 'utf8'));
const utilities_1 = require("./utilities");
// import { calculateAndUpdateStocks, stockCleanUp } from "./cron";
const client = new discord_js_1.Client({
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
exports.client = client;
client.once(discord_js_1.Events.ClientReady, async () => {
    console.log('Ready as ' + client.user.tag);
});
client.on(discord_js_1.Events.InviteCreate, (invite) => {
    if (invite.inviter.bot)
        return;
    if ((0, utilities_1.marketIsOpen)()) {
        db_objects_1.Users.addActivityPoints(invite.inviterId, 1);
    }
});
client.on(discord_js_1.Events.MessageReactionAdd, (_, user) => {
    if (user.bot)
        return;
    if ((0, utilities_1.marketIsOpen)()) {
        db_objects_1.Users.addActivityPoints(user.id, 1);
    }
});
client.on(discord_js_1.Events.VoiceStateUpdate, (oldState, newState) => {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        if ((0, utilities_1.marketIsOpen)()) {
            db_objects_1.Users.addActivityPoints(newState.member.user.id, 1);
        }
    }
});
// COMMAND HANDLING
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.author.bot)
        return;
    const userExists = !!db_objects_1.Users.get(message.author.id);
    if (!userExists) {
        db_objects_1.Users.set(message.author.id);
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
        // Check for remaining cooldown
        const remainingCooldownDuration = await db_objects_1.Users.getRemainingCooldownDuration(message.author.id, commandName);
        if (remainingCooldownDuration > 0) {
            await message.reply({ content: `Please wait, you are on a cooldown for \`${command.command_id}\`. You can use it again in \`${(0, utilities_1.secondsToHms)(remainingCooldownDuration / 1000)}\`.` });
            return;
        }
        // If no cooldown, execute command and set cooldown
        db_objects_1.Commands.execute(command.command_id, message, args);
        if (command.cooldown_time > 0) {
            await db_objects_1.Users.createCooldown(message.author.id, command.command_id);
        }
    }
    else {
        // HANDLE USER ACTIVITY POINTS UPDATING, author and mentions
        if ((0, utilities_1.marketIsOpen)()) {
            const mentionedUsers = message.mentions.users;
            mentionedUsers.forEach(user => {
                if (user.id != message.author.id && !user.bot) {
                    db_objects_1.Users.addActivityPoints(user.id, 1);
                }
            });
            db_objects_1.Users.addActivityPoints(message.author.id, 1);
        }
    }
});
// CRON HANDLING
let stockTicker = node_cron_1.default.schedule(`*/5 ${utilities_1.OPEN_HOUR}-${utilities_1.CLOSE_HOUR} * * *`, () => {
    let randomMinute = Math.floor(Math.random() * 5);
    setTimeout(() => {
        // calculateAndUpdateStocks();
        // TODO: paramaterize channel id?
        // client.channels.fetch("1119995339349430423").then(channel => channel.send("Stocks ticked"));
        console.log("tick");
    }, randomMinute * 60 * 1000);
}, {
    timezone: utilities_1.TIMEZONE
});
let dailyCleanup = node_cron_1.default.schedule('0 5 * * *', () => {
    // stockCleanUp();
    console.log("Cleanup has occurred!");
}, {
    timezone: utilities_1.TIMEZONE
});
// TODO:
// stockTicker.start();
// dailyCleanup.start();
client.login(TOKEN);
