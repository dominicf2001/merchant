import { APIEmbedField, ColorResolvable, ActionRowBuilder, ButtonBuilder, ButtonStyle,
         EmbedBuilder, RestOrArray, APIEmbed, APIActionRowComponent, APIMessageActionRowComponent, normalizeArray, AnyComponentBuilder } from 'discord.js';
import { DateTime } from 'luxon';

const OPEN_HOUR: number = 7;
const CLOSE_HOUR: number = 22;
const CURRENCY_EMOJI_CODE: string = "<:tendie:1115074573264764958>";
const STOCKUP_EMOJI_CODE: string = "<:stockdown:1119370974140301352>";
const STOCKDOWN_EMOJI_CODE: string = "<:stockup:1119370943240863745>";

function secondsToHms(d: number): string {
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function formatNumber(num: number, decimalPlaces: number = 2): number {
  return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}

function marketIsOpen(): boolean {
    const currentHour = DateTime.now().setZone(TIMEZONE).hour;
    return currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR;
}

function toUpperCaseString(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isAMention(arg: string): boolean {
    return arg.startsWith('<@') && !arg.endsWith('>');
}

function findTextArgs(args: string[]): string[] {
    return args.filter(arg => isNaN(+arg) && !isAMention(arg));
}

function findNumericArgs(args: string[]): string[] {
    return args.filter(arg => !isNaN(+arg) && !isAMention(arg));
}

function findMentionArgs(args: string[]): string[] {
    return args.filter(arg => isAMention(arg));
}

class PaginatedMenuBuilder {
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

        // Recalculate the total pages.
        this.totalPages = Math.ceil(this.fields.length / this.pageSize);

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
    
    constructor(id: string) {
        this.id = id;
    }
}

const TIMEZONE: string = 'America/New_York';

export { secondsToHms, getRandomInt, getRandomFloat, formatNumber, marketIsOpen,isAMention,
         toUpperCaseString, findNumericArgs, findTextArgs, findMentionArgs, PaginatedMenuBuilder,
         TIMEZONE, OPEN_HOUR, CLOSE_HOUR, CURRENCY_EMOJI_CODE, STOCKDOWN_EMOJI_CODE, STOCKUP_EMOJI_CODE };
