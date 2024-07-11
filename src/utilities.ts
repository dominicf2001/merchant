import {
    APIEmbedField,
    ColorResolvable,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    RestOrArray,
    normalizeArray,
    Client,
    GatewayIntentBits,
} from "discord.js";
import { DateTime } from "luxon";
import fs from "fs";
import path from "path";
import { Kysely } from "kysely";

export const { TOKEN } = JSON.parse(
    fs.readFileSync(`${__dirname}/../token.json`, "utf8"),
);

// PARAMETERS
const configPath = path.resolve(__dirname, `${__dirname}/../config.json`);
// TODO: refactor to use this var
export const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

export const TICK_CHANNEL_ID: string = config.TICK_CHANNEL_ID;

export const TIMEZONE: string = config.TIMEZONE;
export const OPEN_HOUR: number = config.OPEN_HOUR;
export const CLOSE_HOUR: number = config.CLOSE_HOUR;

export const INVITE_ACTIVITY_VALUE: number = config.INVITE_ACTIVITY_VALUE;
export const VOICE_ACTIVITY_VALUE: number = config.VOICE_ACTIVITY_VALUE;
export const REACTION_ACTIVITY_VALUE: number = config.REACTION_ACTIVITY_VALUE;
export const MESSAGE_ACTIVITY_VALUE: number = config.MESSAGE_ACTIVITY_VALUE;
export const MENTIONED_ACTIVITY_VALUE: number = config.MENTIONED_ACTIVITY_VALUE;

export const MUTE_DURATION_MIN: number = config.MUTE_DURATION_MIN;

export const ITEM_ROB_CHANCE: number = config.ITEM_ROB_CHANCE;
export const CURRENCY_ROB_CHANCE: number = config.CURRENCY_ROB_CHANCE;
export const CURRENCY_ROB_PERCENTAGE: number = config.CURRENCY_ROB_PERCENTAGE;
export const ITEM_FINE_PERCENTAGE: number = config.ITEM_FINE_PERCENTAGE;
export const CURRENCY_FINE_PERCENTAGE: number = config.CURRENCY_FINE_PERCENTAGE;

export const MAX_INV_SIZE: number = config.MAX_INV_SIZE;

export const CURRENCY_EMOJI_CODE: string = config.CURRENCY_EMOJI_CODE;
export const STOCKUP_EMOJI_CODE: string = config.STOCKUP_EMOJI_CODE;
export const STOCKDOWN_EMOJI_CODE: string = config.STOCKDOWN_EMOJI_CODE;

export const DB_NAME: string = config.DB_NAME;
export const DB_HOST: string = config.DB_HOST;
export const DB_USER: string = config.DB_USER;
export const DB_PORT: number = config.DB_PORT;

export const client: Client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildPresences,
    ],
});

// HELPER FUNCTIONS
export function secondsToHms(d: number): string {
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);

    return (
        (h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") +
        m +
        ":" +
        (s < 10 ? "0" : "") +
        s
    );
}

export function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

export function getRandomFloat(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

export function formatNumber(num: number, decimalPlaces: number = 2): number {
    return (
        Math.round(num * Math.pow(10, decimalPlaces)) /
        Math.pow(10, decimalPlaces)
    );
}

export function marketIsOpen(): boolean {
    const currentHour = DateTime.now().setZone(TIMEZONE).hour;
    return currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR;
}

export function toUpperCaseString(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isAMention(arg: string): boolean {
    return arg.startsWith("<@") && arg.endsWith(">");
}

export async function sleep(duration: number): Promise<void> {
    await new Promise((r) => setTimeout(r, duration));
}

export function stripIdFromMention(mentionArg: string): string {
    mentionArg = mentionArg.slice(2, -1);

    if (mentionArg.startsWith("!")) {
        mentionArg = mentionArg.slice(1);
    }

    return mentionArg;
}

export function findTextArgs(args: string[]): string[] {
    return args.filter((arg) => isNaN(+arg) && !isAMention(arg));
}

export function findNumericArgs(args: string[]): string[] {
    return args.filter((arg) => !isNaN(+arg) && !isAMention(arg));
}

export function findMentionArgs(args: string[]): string[] {
    return args.filter((arg) => isAMention(arg));
}

export class PaginatedMenuBuilder {
    private pageNum: number = 1;
    private totalPages: number = 1;
    private id: string = "";
    private pageSize: number = 5;
    private color: ColorResolvable = "blurple" as ColorResolvable;
    private title: string = "";
    private description: string = "";
    private fields: APIEmbedField[] = [];

    setColor(color: ColorResolvable): PaginatedMenuBuilder {
        this.color = color;
        return this;
    }

    setTitle(title: string): PaginatedMenuBuilder {
        this.title = title;
        return this;
    }

    setDescription(description: string): PaginatedMenuBuilder {
        this.description = description;
        return this;
    }

    addFields(...fields: RestOrArray<APIEmbedField>): PaginatedMenuBuilder {
        this.fields.push(...normalizeArray(fields));
        return this;
    }

    createEmbed(): EmbedBuilder {
        const embed = new EmbedBuilder()
            .setColor(this.color)
            .setTitle(this.title)
            .setDescription(
                `Page ${this.pageNum}/${this.totalPages}\n----\n${this.description}\n----\n`,
            )
            .setFields(this.fields);

        return embed;
    }

    // APIActionRowComponent<APIMessageActionRowComponent>
    createButtons(): ActionRowBuilder<ButtonBuilder> {
        const previousBtn = new ButtonBuilder()
            .setCustomId(`${this.id}Previous`)
            .setLabel("Previous")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(this.pageNum === 1);

        const nextBtn = new ButtonBuilder()
            .setCustomId(`${this.id}Next`)
            .setLabel("Next")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(this.pageNum === this.totalPages);

        const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            previousBtn,
            nextBtn,
        );

        return buttonsRow;
    }

    constructor(
        id: string,
        pageSize: number,
        pageNum: number,
        totalPages: number,
    ) {
        this.id = id;
        this.pageSize = pageSize;
        this.pageNum = pageNum;
        this.totalPages = totalPages;
    }
}
