import fs from 'fs';
import path from 'path';
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

// TODO: figure out item and command types
// database type depends on new sql
class DataStore {
    caches: {
        items: Collection<string, Item>,
        commands: Collection<string, Command>,
        users: Collection<string, Command>,
        stocks: Collection<string, Command>
    }
    database: Array<number>

    async refreshCaches() {
        // ITEMS
        const itemsPath = path.join(process.cwd(), 'items');
        const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
        for (const file of itemFiles) {
            const filePath = path.join(itemsPath, file);
            const item = require(filePath);
            if ('data' in item && 'use' in item) {
                this.caches.items.set(item.data.name, item);
            } else {
                console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
            }
        }
        
        // COMMANDS
        const foldersPath = path.join(process.cwd(), 'commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    this.caches.commands.set(command.data.name, command);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }

        // USERS
        const users = await Users.findAll();
        users.forEach(user => this.caches.users.set(user.user_id, user));

        // STOCKS
        const allLatestStocks = await getAllLatestStocks();
        allLatestStocks.forEach(stock => this.caches.stocks.set(stock.user_id, stock));
    }
    
    constructor() {
        this.caches = {
            items: new Collection<string, Item>,
            commands: new Collection<string, Item>,
            users: new Collection<string, Item>,
            stocks: new Collection<string, Item>
        },
        this.database = []
    }
}

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

const dataStore: DataStore = new DataStore();

export { client };

client.once(Events.ClientReady, async () => {
    
    dataStore.refreshCaches();
    
    console.log('Ready as ' + client.user.tag);
});

client.on('inviteCreate', (invite) => {
    if (invite.inviter.bot) return;
    const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        addActivity(invite.inviterId, 2);
    }
});

client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot) return;
    const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        addActivity(user.id, .3);
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
        if (currentHour >= 7 && currentHour < 22) {
            addActivity(newState.member.user.id, 1);
        }
    }
});


// COMMAND HANDLING
client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (!usersCache.has(message.author.id)) {
        const newUser = await Users.create({
            user_id: message.author.id
        });

        usersCache.set(message.author.id, newUser);
    }

    const prefix = '$';

    if (!message.content.startsWith(prefix)) {
        // -- HANDLE USER ACTIVITY UPDATING

        const currentHour = moment().utcOffset('-05:00').format('H');
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
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = client.commands.get(commandName);

        if (!command) return;

        // --- HANDLE COOLDOWN
        const now = Date.now();
        const defaultCooldownDuration = 0;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

        const userCooldown = await UserCooldowns.findOne({
            where: {
                user_id: message.author.id,
                command_name: command.data.name
            }
        });

        // existing cooldown check
        if (userCooldown) {
            const expirationTime = userCooldown.timestamp + cooldownAmount;

            if (now < expirationTime) {
                const expiredTimestampReadable = secondsToHms(Math.round((expirationTime - now) / 1000));
                return message.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again in \`${expiredTimestampReadable}\`.`, ephemeral: true });
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
    let randomMinute = Math.floor(Math.random() * 5);
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
