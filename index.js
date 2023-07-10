const fs = require('node:fs');
const path = require('node:path');
const cron = require('node-cron');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { Users, UserCooldowns } = require("./database/dbObjects.js");
const { usersCache, addActivity } = require("./database/utilities/userUtilities.js");
const moment = require('moment');
const { getAllLatestStocks, latestStocksCache } = require("./database/utilities/stockUtilities.js");
const { secondsToHms, getRandomFloat } = require("./utilities.js");
const { calculateAndUpdateStocks, stockCleanUp } = require("./cron.js");
const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildPresences
    ],
});

module.exports = {client};

client.once(Events.ClientReady, async () => {
    const users = await Users.findAll();
    users.forEach(user => usersCache.set(user.user_id, user));

    const allLatestStocks = await getAllLatestStocks();
    allLatestStocks.forEach(stock => latestStocksCache.set(stock.user_id, stock));

    console.log('Ready as ' + client.user.tag);
});

client.on('inviteCreate', (invite) => {
    if (invite.inviter.bot) return;
    const currentHour = moment().utcOffset('-05:00').format('H');
    if (currentHour >= 7 && currentHour < 22) {
        addActivity(invite.inviterId, 2);
    }
});

client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot) return;
    const currentHour = moment().utcOffset('-05:00').format('H');
    if (currentHour >= 7 && currentHour < 22) {
        addActivity(user.id, .1);
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        const currentHour = moment().utcOffset('-05:00').format('H');
        if (currentHour >= 7 && currentHour < 22) {
            addActivity(newState.member.user.id, 1);
        }
    }
});

// ITEM COLLECTION
client.items = new Collection();

const itemsPath = path.join(__dirname, 'items');
const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
for (const file of itemFiles) {
    const filePath = path.join(itemsPath, file);
    const item = require(filePath);
    if ('data' in item && 'use' in item) {
        client.items.set(item.data.name, item);
    } else {
        console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
    }
}

// COMMAND COLLECTION
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// COMMAND HANDLING
client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (!usersCache.has(message.author.id)){
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
			    if (user.id != message.author.id && !user.bot){
				    addActivity(user.id, .1);
			    }
		    });
		    addActivity(message.author.id, getRandomFloat(.5, 1));
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
            await message.reply('There was an error while executing this command!');
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
