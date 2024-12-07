import cron from "node-cron";
import fs from "fs";
import { EmbedBuilder, Events, PermissionFlagsBits } from "discord.js";
import { getDatastores } from "./database/db-objects";
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
    client,
    SMA_UPDATE_HOURS,
} from "./utilities";
import { DateTime } from "luxon";


client.once(Events.ClientReady, async () => {
    const guilds = client.guilds.cache;
    for (const guild of guilds.values()) {
        const datastores = Object.values(getDatastores(guild.id));
        for (const ds of datastores) {
            await ds.refreshCache();
        }
    }
    console.log("Bot ready as " + client.user.tag);
});

client.on(Events.InviteCreate, async (invite) => {
    if (invite.inviter.bot) return;
    const { Users } = getDatastores(invite.guild.id);

    if (marketIsOpen()) {
        await Users.addActivity(
            invite.inviterId,
            INVITE_ACTIVITY_VALUE * getRandomInt(1, 2),
        );
    }
});

client.on(Events.MessageReactionAdd, async (interaction, user) => {
    if (user.bot) return;
    const { Users } = getDatastores(interaction.message.guild.id);

    if (marketIsOpen()) {
        await Users.addActivity(
            user.id,
            REACTION_ACTIVITY_VALUE * getRandomInt(1, 2),
        );
    }
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    if (oldState.channel || !newState.channel || newState.member.user.bot)
        return;

    const { Users } = getDatastores(oldState.guild.id);

    if (marketIsOpen()) {
        await Users.addActivity(
            newState.member.user.id,
            VOICE_ACTIVITY_VALUE * getRandomInt(1, 2),
        );
    }
});

// COMMAND HANDLING
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const { Users, Stocks } = getDatastores(message.guildId);

    // this needs to come before stocks exists
    if (!Users.exists(message.author.id)) {
        await Users.set(message.author.id);
    }

    if (!Stocks.exists(message.author.id)) {
        await Stocks.set(message.author.id);
    }

    // HANDLE USER ACTIVITY POINTS UPDATING, author and mentions
    if (marketIsOpen()) {
        const mentionedUsers = message.mentions.users;
        mentionedUsers.forEach(async (user) => {
            if (user.id != message.author.id && !user.bot) {
                await Users.addActivity(
                    user.id,
                    MENTIONED_ACTIVITY_VALUE * getRandomInt(1, 2),
                );
            }
        });
        await Users.addActivity(
            message.author.id,
            MESSAGE_ACTIVITY_VALUE * getRandomInt(1, 2),
        );
    }
});

client.on(Events.InteractionCreate, async interaction => {

    if (interaction.isChatInputCommand() && interaction.inGuild()) {
        const { Users, Commands } = getDatastores(interaction.guildId);

        const commandName = interaction.commandName;
        const command = await Commands.get(commandName)
        if (!command) return;

        await interaction.deferReply();

        if (command.is_admin && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
            await interaction.editReply(
                "You do not have permission to use this command.",
            );
            return;
        }

        // Check for remaining cooldown
        const remainingCooldownDuration: number =
            await Users.getRemainingCooldownDuration(
                interaction.user.id,
                commandName,
            );
        if (remainingCooldownDuration > 0) {
            await interaction.editReply({
                content: `Please wait, you are on a cooldown for \`${command.command_id}\`. You can use it again in \`${secondsToHms(remainingCooldownDuration / 1000)}\`.`,
            });
            return;
        }

        try {
            // If no cooldown, execute command and set cooldown

            const member = interaction.guild.members.cache.get(interaction.user.id)
            const reply = await Commands.execute(command.command_id, member, interaction.options);
            if (reply instanceof EmbedBuilder) await interaction.editReply({ embeds: [reply] });
            else await interaction.editReply(reply);

            if (command.cooldown_time > 0) {
                await Users.createCooldown(
                    interaction.user.id,
                    command.command_id,
                );
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply(error.message);
        }
    }
})

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
                    const guilds = client.guilds.cache;
                    for (const guild of guilds.values()) {
                        await updateStockPrices(guild.id);
                    }
                    logToFile("Stock prices updated successfully.");
                    // const tickChannel = await client.channels.fetch(TICK_CHANNEL_ID);
                    //if (tickChannel.isTextBased()) {
                    //    await tickChannel.send("Stocks ticked");
                    //}
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

let updateTimes = "";
for (let i = 0; i < SMA_UPDATE_HOURS.length; ++i) {
    updateTimes += SMA_UPDATE_HOURS[i];
    if (i != SMA_UPDATE_HOURS.length - 1) {
        updateTimes += ",";
    }
}

let smaUpdater = cron.schedule(
    `0 ${updateTimes} * * *`,
    async () => {
        try {
            const guilds = client.guilds.cache;
            for (const guild of guilds.values()) {
                await updateSMAS(guild.id);
            }
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
            const guilds = client.guilds.cache;
            for (const guild of guilds.values()) {
                const { Stocks } = getDatastores(guild.id);
                await Stocks.cleanUpStocks();
            }
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
