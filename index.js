const fs = require('node:fs');
const path = require('node:path');
const cron = require('node-cron');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { Users, UserCooldowns } = require("./database/dbObjects.js");
const { usersCache, addActivity } = require("./database/utilities/userUtilities.js");
const { getAllLatestStocks, latestStocksCache } = require("./database/utilities/stockUtilities.js");
const { secondsToHms } = require("./utilities.js");
const { calculateAndUpdateStocks } = require("./cron.js");

const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites
    ],
});

client.once(Events.ClientReady, async () => {
    const users = await Users.findAll();
    users.forEach(user => usersCache.set(user.user_id, user));

    const allLatestStocks = await getAllLatestStocks();
    allLatestStocks.forEach(stock => latestStocksCache.set(stock.user_id, stock));
    console.log('Ready as ' + client.user.tag);
});

client.on('inviteCreate', (invite) => {
    if (invite.inviter.bot) return;
    addActivity(invite.inviterId, 8);
});

client.on('messageReactionAdd', (messageReaction, user) => {
    if (user.bot) return;
    addActivity(user.id, 1);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        addActivity(newState.member.user.id, 5);
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
        const mentionedUsers = message.mentions.users;

        mentionedUsers.forEach(user => {
            if (user.id != message.author.id && !user.bot){
                addActivity(user.id, 4);
            }
        });

        addActivity(message.author.id, 2);

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
        } catch (error) {
            console.error(error);
            await message.reply('There was an error while executing this command!');
        }

        // create new cooldown after command execution
        await UserCooldowns.create({
            user_id: message.author.id,
            command_name: command.data.name,
            timestamp: now
        });

        setTimeout(async () => {
            const userCooldown = await UserCooldowns.findOne({
                where: { user_id: message.author.id, command_name: command.data.name },
            });
            if (userCooldown && userCooldown.timestamp === now) {
                await userCooldown.destroy();
            }
        }, cooldownAmount);
        // ---
    }
});

let task = cron.schedule('0 7-23 * * *', calculateAndUpdateStocks, {
  timezone: "America/New_York"
});

task.start();

client.login(token);
