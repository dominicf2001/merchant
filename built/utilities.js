"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STOCKUP_EMOJI_CODE = exports.STOCKDOWN_EMOJI_CODE = exports.CURRENCY_EMOJI_CODE = exports.CLOSE_HOUR = exports.OPEN_HOUR = exports.TIMEZONE = exports.PaginatedMenuBuilder = exports.findMentionArgs = exports.findTextArgs = exports.findNumericArgs = exports.toUpperCaseString = exports.isAMention = exports.marketIsOpen = exports.formatNumber = exports.getRandomFloat = exports.getRandomInt = exports.secondsToHms = void 0;
const discord_js_1 = require("discord.js");
const luxon_1 = require("luxon");
const OPEN_HOUR = 7;
exports.OPEN_HOUR = OPEN_HOUR;
const CLOSE_HOUR = 22;
exports.CLOSE_HOUR = CLOSE_HOUR;
const CURRENCY_EMOJI_CODE = "<:tendie:1115074573264764958>";
exports.CURRENCY_EMOJI_CODE = CURRENCY_EMOJI_CODE;
const STOCKUP_EMOJI_CODE = "<:stockdown:1119370974140301352>";
exports.STOCKUP_EMOJI_CODE = STOCKUP_EMOJI_CODE;
const STOCKDOWN_EMOJI_CODE = "<:stockup:1119370943240863745>";
exports.STOCKDOWN_EMOJI_CODE = STOCKDOWN_EMOJI_CODE;
function secondsToHms(d) {
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);
    return ((h > 0 ? h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s);
}
exports.secondsToHms = secondsToHms;
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
exports.getRandomInt = getRandomInt;
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
exports.getRandomFloat = getRandomFloat;
function formatNumber(num, decimalPlaces = 2) {
    return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}
exports.formatNumber = formatNumber;
function marketIsOpen() {
    const currentHour = luxon_1.DateTime.now().setZone(TIMEZONE).hour;
    return currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR;
}
exports.marketIsOpen = marketIsOpen;
function toUpperCaseString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.toUpperCaseString = toUpperCaseString;
function isAMention(arg) {
    return arg.startsWith('<@') && !arg.endsWith('>');
}
exports.isAMention = isAMention;
function findTextArgs(args) {
    return args.filter(arg => isNaN(+arg) && !isAMention(arg));
}
exports.findTextArgs = findTextArgs;
function findNumericArgs(args) {
    return args.filter(arg => !isNaN(+arg) && !isAMention(arg));
}
exports.findNumericArgs = findNumericArgs;
function findMentionArgs(args) {
    return args.filter(arg => isAMention(arg));
}
exports.findMentionArgs = findMentionArgs;
class PaginatedMenuBuilder {
    pageNum = 1;
    totalPages = 1;
    id = "";
    pageSize = 5;
    color = "blurple";
    title = "";
    description = "";
    fields = [];
    setColor(color) {
        this.color = color;
        return this;
    }
    setTitle(title) {
        this.title = title;
        return this;
    }
    setDescription(description) {
        this.description = description;
        return this;
    }
    addFields(...fields) {
        this.fields.push(...(0, discord_js_1.normalizeArray)(fields));
        // Recalculate the total pages.
        this.totalPages = Math.ceil(this.fields.length / this.pageSize);
        return this;
    }
    createEmbed() {
        const embed = new discord_js_1.EmbedBuilder()
            .setColor(this.color)
            .setTitle(this.title)
            .setDescription(`Page ${this.pageNum}/${this.totalPages}\n----\n${this.description}\n----\n`)
            .setFields(this.fields);
        return embed;
    }
    // APIActionRowComponent<APIMessageActionRowComponent>
    createButtons() {
        const previousBtn = new discord_js_1.ButtonBuilder()
            .setCustomId(`${this.id}Previous`)
            .setLabel('Previous')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(this.pageNum === 1);
        const nextBtn = new discord_js_1.ButtonBuilder()
            .setCustomId(`${this.id}Next`)
            .setLabel('Next')
            .setStyle(discord_js_1.ButtonStyle.Primary)
            .setDisabled(this.pageNum === this.totalPages);
        const buttonsRow = new discord_js_1.ActionRowBuilder()
            .addComponents(previousBtn, nextBtn);
        return buttonsRow;
    }
    constructor(id) {
        this.id = id;
    }
}
exports.PaginatedMenuBuilder = PaginatedMenuBuilder;
const TIMEZONE = 'America/New_York';
exports.TIMEZONE = TIMEZONE;
