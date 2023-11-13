import { APIEmbedField, ColorResolvable, ActionRowBuilder, ButtonBuilder, ButtonStyle,
         EmbedBuilder, RestOrArray, normalizeArray, User } from 'discord.js';
import { DateTime } from 'luxon';
import { client } from './index';

// PARAMETERS
export const TIMEZONE: string = 'America/New_York';
export const OPEN_HOUR: number = 7;
export const CLOSE_HOUR: number = 22;

export const INVITE_ACTIVITY_VALUE: number = 1;
export const VOICE_ACTIVITY_VALUE: number = 1;
export const REACTION_ACTIVITY_VALUE: number = 1;
export const MESSAGE_ACTIVITY_VALUE: number = 1;
export const MENTIONED_ACTIVITY_VALUE: number = 1;

export const MUTE_DURATION_MIN: number = 5;

// these are out of 100
export const ITEM_ROB_CHANCE: number = 20;
export const CURRENCY_ROB_CHANCE: number = 70;
export const CURRENCY_ROB_PERCENTAGE: number = 5;
export const ITEM_FINE_PERCENTAGE: number = 9;
export const CURRENCY_FINE_PERCENTAGE: number = 9;

export const MAX_INV_SIZE: number = 5;

export const CURRENCY_EMOJI_CODE: string = "<:tendie:1117239821337890886>";
export const STOCKUP_EMOJI_CODE: string = "<:stockup:1117496842867982407>";
export const STOCKDOWN_EMOJI_CODE: string = "<:stockdown:1117496855870328833>";


// HELPER FUNCTIONS
export function secondsToHms(d: number): string {
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function formatNumber(num: number, decimalPlaces: number = 2): number {
  return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}

export function marketIsOpen(): boolean {
    const currentHour = DateTime.now().setZone(TIMEZONE).hour;
    return currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR;
}

export function toUpperCaseString(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isAMention(arg: string): boolean {    
	return arg.startsWith('<@') && arg.endsWith('>');
}

export function stripIdFromMention(mentionArg: string): string {
    mentionArg = mentionArg.slice(2, -1);

    if (mentionArg.startsWith('!')) {
        mentionArg = mentionArg.slice(1);
    }

    return mentionArg;
}

export function findTextArgs(args: string[]): string[] {
    return args.filter(arg => isNaN(+arg) && !isAMention(arg));
}

export function findNumericArgs(args: string[]): string[] {
    return args.filter(arg => !isNaN(+arg) && !isAMention(arg));
}

export function findMentionArgs(args: string[]): string[] {
    return args.filter(arg => isAMention(arg));
}

export async function fetchDiscordUser(id: string): Promise<User> {
    return await client.users.fetch(id);
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
            .setDescription(`Page ${this.pageNum}/${this.totalPages}\n----\n${this.description}\n----\n`)
            .setFields(this.fields);
        
        return embed;
    }

    // APIActionRowComponent<APIMessageActionRowComponent>
    createButtons(): ActionRowBuilder<ButtonBuilder> {
        const previousBtn = new ButtonBuilder()
            .setCustomId(`${this.id}Previous`)
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(this.pageNum === 1);

        const nextBtn = new ButtonBuilder()
            .setCustomId(`${this.id}Next`)
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(this.pageNum === this.totalPages);

        const buttonsRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(previousBtn, nextBtn);

        return buttonsRow;
    }
    
    constructor(id: string, pageSize: number, pageNum: number, totalPages: number) {
        this.id = id;
        this.pageSize = pageSize;
        this.pageNum = pageNum;
        this.totalPages = totalPages;
    }
}
