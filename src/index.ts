import cron from 'node-cron';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { Users } from '@database/db-objects';
import token from '../config.json';
import { secondsToHms, getRandomFloat, marketIsOpen, TIMEZONE, OPEN_HOUR, CLOSE_HOUR } from "./utilities";
import { calculateAndUpdateStocks, stockCleanUp } from "./cron";

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildPresences
    ],
});

export { client };

// TODO: make a json file with ALL paramaters

client.once(Events.ClientReady, async () => {    
    console.log('Ready as ' + client.user.tag);
});

client.on(Events.InviteCreate, (invite) => {
    if (invite.inviter.bot) return;
    
    if (marketIsOpen()) {
        Users.addActivityPoints(invite.inviterId, 1);
    }
});

client.on(Events.MessageReactionAdd, (_, user) => {
    if (user.bot) return;
    
    if (marketIsOpen()) {
        Users.addActivityPoints(user.id, 1);
    }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        if (marketIsOpen()) {
            Users.addActivityPoints(newState.member.user.id, 1);
        }
    }
});


// COMMAND HANDLING
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    
    const userExists: boolean = !!Users.get(message.author.id);
    if (!userExists) {
        Users.set(message.author.id);
    }

    const prefix: string = '$';
    const isCommand: boolean = message.content.startsWith(prefix);
    
    if (isCommand) {
        const args: string[] = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName: string = args.shift().toLowerCase();

        // TODO
        const command = dataStore.caches["commands"].get(commandName);

        if (!command) return;

        // TODO: move into a cooldown check function on Users
        // HANDLE COMMAND COOLDOWN
        const now: number = Date.now();
        const defaultCooldownDuration: number = 0;
        const cooldownAmount: number = (command.cooldown ?? defaultCooldownDuration) * 1000;

        const userCooldown = await UserCooldowns.findOne({
            where: {
                user_id: message.author.id,
                command_name: command.data.name
            }
        });

        // existing cooldown check
        if (userCooldown) {
            const expirationTime: number = userCooldown.timestamp + cooldownAmount;

            if (now < expirationTime) {
                const expiredTimestampReadable: string = secondsToHms(Math.round((expirationTime - now) / 1000));
                return message.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again in \`${expiredTimestampReadable}\`.`});
            } else {
                await userCooldown.destroy();
            }
        }

        try {
            await command.execute(message, args);
            // create new cooldown after command execution
            await UserCooldowns.create({
                user_id: message.author.id,
                command_name: command.data.name,
                timestamp: now
            });
        } catch (error) {
            console.error(error);
            await message.reply(error.message);
        }
    } else {
        // HANDLE USER ACTIVITY POINTS UPDATING, author and mentions
        if (marketIsOpen()) {
            const mentionedUsers = message.mentions.users;
            mentionedUsers.forEach(user => {
                if (user.id != message.author.id && !user.bot) {
                    Users.addActivityPoints(user.id, 1);
                }
            });
            Users.addActivityPoints(message.author.id, 1);
        }
    }
});

// CRON HANDLING
let stockTicker = cron.schedule(`*/5 ${OPEN_HOUR}-${CLOSE_HOUR} * * *`, () => {
    let randomMinute: number = Math.floor(Math.random() * 5);
    setTimeout(() => {
        calculateAndUpdateStocks();
        // TODO: paramaterize channel id?
        client.channels.fetch("1119995339349430423").then(channel => channel.send("Stocks ticked"));
        console.log("tick");
    }, randomMinute * 60 * 1000);
}, {
    timezone: TIMEZONE
});

let dailyCleanup = cron.schedule('0 5 * * *', () => {
    stockCleanUp();
    console.log("Cleanup has occurred!");
}, {
    timezone: TIMEZONE
});

stockTicker.start();
dailyCleanup.start();

client.login(token);
