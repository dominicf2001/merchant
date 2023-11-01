
import cron from 'node-cron';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import token from '../config.json';
import { Users, Stocks, Items } from "./database/db-objects";
import { secondsToHms, getRandomFloat } from "./utilities";
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

// EVENTS

client.once(Events.ClientReady, async () => {

    await Promise.all([
        Users.refreshCache().catch(err => console.error("Error refreshing Users cache:", err)),
        Stocks.refreshCache().catch(err => console.error("Error refreshing Stocks cache:", err)),
        Items.refreshCache().catch(err => console.error("Error refreshing Items cache:", err))
    ]);
    
    console.log('Ready as ' + client.user.tag);
});

client.on(Events.InviteCreate, (invite) => {
    if (invite.inviter.bot) return;
    const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        Users.addActivityPoints(invite.inviterId, 2);
    }
});

client.on(Events.MessageReactionAdd, (_, user) => {
    if (user.bot) return;
    const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        Users.addActivityPoints(user.id, .3);
    }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
        if (currentHour >= 7 && currentHour < 22) {
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

        const command = dataStore.caches["commands"].get(commandName);

        if (!command) return;

        // TODO: move into a cooldown check function on Users
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
    } else {
        // -- HANDLE USER ACTIVITY UPDATING

        // TODO: convert to luxon
        const currentHour: number = Number(moment().utcOffset('-05:00').format('H'));
        if (currentHour >= 7 && currentHour < 22) {
            const mentionedUsers = message.mentions.users;
            mentionedUsers.forEach(user => {
                if (user.id != message.author.id && !user.bot) {
                    Users.addActivity(user.id, .5);
                }
            });
            Users.addActivity(message.author.id, getRandomFloat(.3, .75));
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
