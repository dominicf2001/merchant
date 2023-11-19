import cron from 'node-cron';
import fs from 'fs';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { Users, Commands, Stocks } from './database/db-objects';
import { updateSMAS, updateStockPrices } from './stock-utilities';
const { TOKEN } = JSON.parse(fs.readFileSync(`${__dirname}/../token.json`, 'utf8'));
import { secondsToHms, marketIsOpen,
         TIMEZONE, OPEN_HOUR, CLOSE_HOUR, VOICE_ACTIVITY_VALUE, REACTION_ACTIVITY_VALUE,
         MESSAGE_ACTIVITY_VALUE, MENTIONED_ACTIVITY_VALUE, INVITE_ACTIVITY_VALUE } from "./utilities";

// import { calculateAndUpdateStocks, stockCleanUp } from "./cron";

export const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences
    ],
});

client.once(Events.ClientReady, async () => {    
    console.log('Ready as ' + client.user.tag);
});

client.on(Events.InviteCreate, async (invite) => {
    if (invite.inviter.bot)
        return;
    
    if (marketIsOpen()) {
        await Users.addActivityPoints(invite.inviterId, INVITE_ACTIVITY_VALUE);
    }
});

client.on(Events.MessageReactionAdd, async (_, user) => {
    if (user.bot)
        return;
    
    if (marketIsOpen()) {
        await Users.addActivityPoints(user.id, REACTION_ACTIVITY_VALUE);
    }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (oldState.channel || !newState.channel || newState.member.user.bot)
        return;
    
    if (marketIsOpen()) {
        await Users.addActivityPoints(newState.member.user.id, VOICE_ACTIVITY_VALUE);
    }
});
 

// COMMAND HANDLING
client.on(Events.MessageCreate, async message => {
    if (message.author.bot)
        return;
    
    const user = Users.get(message.author.id);
    if (user) {
        await Users.set(message.author.id);
        await Stocks.updateStockPrice(message.author.id, 1);
    }

    const prefix: string = '$';
    const isCommand: boolean = message.content.startsWith(prefix);

    // When a command is called
    if (isCommand && message.channelId === "1030306981052948511") {
        const args: string[] = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName: string = args.shift().toLowerCase();

        const command = await Commands.get(commandName);
        if (!command)
            return;

        if (command.is_admin && message.member.moderatable) {
            await message.reply("You do not have permission to use this command.");
            return;
        }
 
        // Check for remaining cooldown
        const remainingCooldownDuration: number = await Users.getRemainingCooldownDuration(message.author.id, commandName);
        if (remainingCooldownDuration > 0) {
            await message.reply({ content: `Please wait, you are on a cooldown for \`${command.command_id}\`. You can use it again in \`${secondsToHms(remainingCooldownDuration / 1000)}\`.` });
            return;
        }

        // If no cooldown, execute command and set cooldown
        await Commands.execute(command.command_id, message, args);
        if (command.cooldown_time > 0) {
            await Users.createCooldown(message.author.id, command.command_id);
        }
    }
    else {
        // HANDLE USER ACTIVITY POINTS UPDATING, author and mentions
        if (marketIsOpen()) {
            const mentionedUsers = message.mentions.users;
            mentionedUsers.forEach(async user => {
                if (user.id != message.author.id && !user.bot) {
                    await Users.addActivityPoints(user.id, MENTIONED_ACTIVITY_VALUE);
                }
            });
            await Users.addActivityPoints(message.author.id, MESSAGE_ACTIVITY_VALUE);
        }
    }
});

// CRON HANDLING
function logToFile(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;

    fs.appendFile('cron.log', logMessage, (err) => {
        if (err) console.error('Error writing to log file:', err);
    });
}

let stockTicker = cron.schedule(`*/5 ${OPEN_HOUR}-${CLOSE_HOUR} * * *`, () => {
    // update prices at a random minute within the next 5 minutes
    let randomMinute: number = Math.floor(Math.random() * 5);
    
    setTimeout(async () => {
        try {
            await updateStockPrices();
            // TODO: paramaterize channel id or turn into command
            // const channel = await client.channels.fetch("608853914535854103");
            // if (channel.isTextBased()) {
            //     await channel.send('Stocks ticked');
            // }
            logToFile('Stock prices updated successfully.');
        }
        catch (error) {
            logToFile(`Stock price update failed: ${error.message}`);
            console.error(error);
        }
    }, randomMinute * 60 * 1000);
}, {
    timezone: TIMEZONE
});

const updateTimes = `${OPEN_HOUR + 1},${OPEN_HOUR + 7},${OPEN_HOUR + 13}`;
let smaUpdater = cron.schedule(`0 ${updateTimes} * * *`, async () => {
    try {
        await updateSMAS();
        logToFile('SMA updated successfully.');
    }
    catch (error) {
        console.error(error);
        logToFile(`SMA update failed: ${error.message}`);
    }
}, {
    timezone: TIMEZONE
});

// TODO
let dailyCleanup = cron.schedule('0 5 * * *', async () => {
    try {
        await Stocks.cleanUpStocks();
        console.log("Cleanup has occurred!");
        logToFile('Daily cleanup executed successfully.');        
    }
    catch (error) {
        console.error(error);
        logToFile(`Daily cleanup failed: ${error.message}`);
    }
}, {
    timezone: TIMEZONE
});

stockTicker.start();
smaUpdater.start();
dailyCleanup.start();

client.login(TOKEN);
