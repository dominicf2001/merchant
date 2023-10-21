
import sequelize from 'sequelize';
import cron from 'node-cron';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import token from '../config.json';
import { Users, UserCooldowns } from "./database/dbObjects";
import { usersCache, addActivity } from "./database/utilIties/userUtilities";
import moment from 'moment';
import { getAllLatestStocks, latestStocksCache } from "./database/utilities/stockUtilities";
import { secondsToHms, getRandomFloat } from "./utilities";
import { calculateAndUpdateStocks, stockCleanUp } from "./cron";

const dataStore: DataStore = new DataStore();

const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMember,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildPresences
    ],
});

export { client };

// EVENTS

client.once(Events.ClientReady, async () => {
    
    dataStore.refreshCaches();
    
    console.log('Ready as ' + client.user.tag);
});

client.on(Events.InviteCreate, (invite) => {
    if (invite.inviter.bot) return;
    const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        addActivity(invite.inviterId, 2);
    }
});

client.on(Events.MessageReactionAdd, (_, user) => {
    if (user.bot) return;
    const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        addActivity(user.id, .3);
    }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
        if (currentHour >= 7 && currentHour < 22) {
            addActivity(newState.member.user.id, 1);
        }
    }
});


// COMMAND HANDLING
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    const usersCache = dataStore.caches["users"];
    
    if (!usersCache.has(message.author.id)) {
        const newUser = await Users.create({
            user_id: message.author.id
        });

        users.set(message.author.id, newUser);
    }

    const prefix: string = '$';

    if (!message.content.startsWith(prefix)) {
        // -- HANDLE USER ACTIVITY UPDATING

        const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
        if (currentHour >= 7 && currentHour < 22) {
            const mentionedUsers = message.mentions.users;
            mentionedUsers.forEach(user => {
                if (user.id != message.author.id && !user.bot) {
                    addActivity(user.id, .5);
                }
            });
            addActivity(message.author.id, getRandomFloat(.3, .75));
        }
        // ---
    } else {
        const args: string[] = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName: string = args.shift().toLowerCase();

        const command = dataStore.caches["commands"].get(commandName);

        if (!command) return;

        // --- HANDLE COOLDOWN
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
                return message.reply({ content:`Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again in \`${expiredTimestampReadable}\`.`, ephemeral: true });
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
    }
});

let stockTicker = cron.schedule('*/5 7-22 * * *', () => {
    let randomMinute: number = Math.floor(Math.random() * 5);
    setTimeout(() => {
        calculateAndUpdateStocks();
        client.channels.fetch("1119995339349430423").then(channel => channel.send("Stocks ticked"));
        console.log("tick");
    }, randomMinute * 60 * 1000);
}, {
    timezone: "America/New_York"
});

let dailyCleanup = cron.schedule('0 5 * * *', () => {
    stockCleanUp();
    console.log("Cleanup has occurred!");
}, {
    timezone: "America/New_York"
});

stockTicker.start();
dailyCleanup.start();

client.login(token);
