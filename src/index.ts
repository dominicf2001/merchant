import cron from "node-cron";
import fs from "fs";
import { Events, EmbedBuilder } from "discord.js";
import { Users, Commands, Stocks, datastores } from "./database/db-objects";
import { updateSMAS, updateStockPrices } from "./stock-utilities";
import {
    secondsToHms,
    marketIsOpen,
    getRandomInt,
    TIMEZONE,
    OPEN_HOUR,
    CLOSE_HOUR,
    VOICE_ACTIVITY_VALUE,
    REACTION_ACTIVITY_VALUE,
    MESSAGE_ACTIVITY_VALUE,
    MENTIONED_ACTIVITY_VALUE,
    INVITE_ACTIVITY_VALUE,
    TOKEN,
    TICK_CHANNEL_ID,
    client,
} from "./utilities";
import { DateTime } from "luxon";

client.once(Events.ClientReady, async () => {
    datastores.forEach(ds => ds.refreshCache());
    console.log("Bot ready as " + client.user.tag);
});

client.on(Events.InviteCreate, async (invite) => {
    if (invite.inviter.bot) return;

    if (marketIsOpen()) {
        await Users.addActivity(
            invite.inviterId,
            INVITE_ACTIVITY_VALUE * getRandomInt(2, 4),
        );
    }
});

client.on(Events.MessageReactionAdd, async (_, user) => {
    if (user.bot) return;

    if (marketIsOpen()) {
        await Users.addActivity(
            user.id,
            REACTION_ACTIVITY_VALUE * getRandomInt(2, 4),
        );
    }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (oldState.channel || !newState.channel || newState.member.user.bot)
        return;

    if (marketIsOpen()) {
        await Users.addActivity(
            newState.member.user.id,
            VOICE_ACTIVITY_VALUE * getRandomInt(2, 4),
        );
    }
});

// COMMAND HANDLING
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const user = await Users.get(message.author.id);
    if (user) {
        await Users.set(message.author.id);
        await Stocks.updateStockPrice(message.author.id, 1);
    }

    const prefix: string = "$";
    const isCommand: boolean = message.content.startsWith(prefix);

    // When a command is called
    if (isCommand) {
        const args: string[] = message.content
            .slice(prefix.length)
            .trim()
            .split(/ +/);
        const commandName: string = args.shift().toLowerCase();

        const command = await Commands.get(commandName);
        if (!command) return;

        if (command.is_admin && message.member.moderatable) {
            await message.reply(
                "You do not have permission to use this command.",
            );
            return;
        }

        // Check for remaining cooldown
        const remainingCooldownDuration: number =
            await Users.getRemainingCooldownDuration(
                message.author.id,
                commandName,
            );
        if (remainingCooldownDuration > 0) {
            await message.reply({
                content: `Please wait, you are on a cooldown for \`${command.command_id}\`. You can use it again in \`${secondsToHms(remainingCooldownDuration / 1000)}\`.`,
            });
            return;
        }

        try {
            // If no cooldown, execute command and set cooldown
            await Commands.execute(command.command_id, message, args);
            if (command.cooldown_time > 0) {
                await Users.createCooldown(
                    message.author.id,
                    command.command_id,
                );
            }
        } catch (error) {
            console.error(error);
            const embed = new EmbedBuilder().setColor("Yellow").setFields({
                name: `An error occurred when executing ${command.command_id}. Please try again later.`,
                value: ` `,
            });
            await message.reply({ embeds: [embed] });
        }
    } else {
        // HANDLE USER ACTIVITY POINTS UPDATING, author and mentions
        if (marketIsOpen()) {
            const mentionedUsers = message.mentions.users;
            mentionedUsers.forEach(async (user) => {
                if (user.id != message.author.id && !user.bot) {
                    await Users.addActivity(
                        user.id,
                        MENTIONED_ACTIVITY_VALUE * getRandomInt(2, 4),
                    );
                }
            });
            await Users.addActivity(
                message.author.id,
                MESSAGE_ACTIVITY_VALUE * getRandomInt(2, 4),
            );
        }
    }
});

// CRON HANDLING
function logToFile(message: string): void {
    const timestamp = DateTime.now().toISO();
    const logMessage = `${timestamp} - ${message}\n`;

    fs.appendFile("cron.log", logMessage, (err) => {
        if (err) console.error("Error writing to log file:", err);
    });
}

let stockTicker = cron.schedule(
    `*/5 ${OPEN_HOUR}-${CLOSE_HOUR} * * *`,
    () => {
        // update prices at a random minute within the next 5 minutes
        let randomMinute: number = Math.floor(Math.random() * 5);

        setTimeout(
            async () => {
                try {
                    await updateStockPrices();
                    logToFile("Stock prices updated successfully.");
                    const tickChannel =
                        await client.channels.fetch(TICK_CHANNEL_ID);
                    if (tickChannel.isTextBased()) {
                        await tickChannel.send("Stocks ticked");
                    }
                } catch (error) {
                    logToFile(`Stock price update failed: ${error.message}`);
                    console.error(error);
                }
            },
            randomMinute * 60 * 1000,
        );
    },
    {
        timezone: TIMEZONE,
    },
);

const updateTimes = `${OPEN_HOUR + 1},${OPEN_HOUR + 7},${OPEN_HOUR + 13}`;
let smaUpdater = cron.schedule(
    `0 ${updateTimes} * * *`,
    async () => {
        try {
            await updateSMAS();
            logToFile("SMA updated successfully.");
        } catch (error) {
            console.error(error);
            logToFile(`SMA update failed: ${error.message}`);
        }
    },
    {
        timezone: TIMEZONE,
    },
);

// TODO
let dailyCleanup = cron.schedule(
    "0 5 * * *",
    async () => {
        try {
            await Stocks.cleanUpStocks();
            console.log("Cleanup has occurred!");
            logToFile("Daily cleanup executed successfully.");
        } catch (error) {
            console.error(error);
            logToFile(`Daily cleanup failed: ${error.message}`);
        }
    },
    {
        timezone: TIMEZONE,
    },
);

stockTicker.start();
smaUpdater.start();
dailyCleanup.start();

client.login(TOKEN);
