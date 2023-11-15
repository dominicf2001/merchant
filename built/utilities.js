"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginatedMenuBuilder = exports.findMentionArgs = exports.findNumericArgs = exports.findTextArgs = exports.stripIdFromMention = exports.isAMention = exports.toUpperCaseString = exports.marketIsOpen = exports.formatNumber = exports.getRandomFloat = exports.getRandomInt = exports.secondsToHms = exports.STOCKDOWN_EMOJI_CODE = exports.STOCKUP_EMOJI_CODE = exports.CURRENCY_EMOJI_CODE = exports.MAX_INV_SIZE = exports.CURRENCY_FINE_PERCENTAGE = exports.ITEM_FINE_PERCENTAGE = exports.CURRENCY_ROB_PERCENTAGE = exports.CURRENCY_ROB_CHANCE = exports.ITEM_ROB_CHANCE = exports.MUTE_DURATION_MIN = exports.MENTIONED_ACTIVITY_VALUE = exports.MESSAGE_ACTIVITY_VALUE = exports.REACTION_ACTIVITY_VALUE = exports.VOICE_ACTIVITY_VALUE = exports.INVITE_ACTIVITY_VALUE = exports.CLOSE_HOUR = exports.OPEN_HOUR = exports.TIMEZONE = void 0;
const discord_js_1 = require("discord.js");
const luxon_1 = require("luxon");
// PARAMETERS
exports.TIMEZONE = 'America/New_York';
exports.OPEN_HOUR = 7;
exports.CLOSE_HOUR = 22;
exports.INVITE_ACTIVITY_VALUE = 1;
exports.VOICE_ACTIVITY_VALUE = 1;
exports.REACTION_ACTIVITY_VALUE = 1;
exports.MESSAGE_ACTIVITY_VALUE = 1;
exports.MENTIONED_ACTIVITY_VALUE = 1;
exports.MUTE_DURATION_MIN = 5;
// these are out of 100
exports.ITEM_ROB_CHANCE = 20;
exports.CURRENCY_ROB_CHANCE = 70;
exports.CURRENCY_ROB_PERCENTAGE = 5;
exports.ITEM_FINE_PERCENTAGE = 9;
exports.CURRENCY_FINE_PERCENTAGE = 9;
exports.MAX_INV_SIZE = 5;
exports.CURRENCY_EMOJI_CODE = "<:tendie:1117239821337890886>";
exports.STOCKUP_EMOJI_CODE = "<:stockup:1117496842867982407>";
exports.STOCKDOWN_EMOJI_CODE = "<:stockdown:1117496855870328833>";
// HELPER FUNCTIONS
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
    const currentHour = luxon_1.DateTime.now().setZone(exports.TIMEZONE).hour;
    return currentHour >= exports.OPEN_HOUR && currentHour < exports.CLOSE_HOUR;
}
exports.marketIsOpen = marketIsOpen;
function toUpperCaseString(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.toUpperCaseString = toUpperCaseString;
function isAMention(arg) {
    return arg.startsWith('<@') && arg.endsWith('>');
}
exports.isAMention = isAMention;
function stripIdFromMention(mentionArg) {
    mentionArg = mentionArg.slice(2, -1);
    if (mentionArg.startsWith('!')) {
        mentionArg = mentionArg.slice(1);
    }
    return mentionArg;
}
exports.stripIdFromMention = stripIdFromMention;
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
    constructor(id, pageSize, pageNum, totalPages) {
        this.id = id;
        this.pageSize = pageSize;
        this.pageNum = pageNum;
        this.totalPages = totalPages;
    }
}
exports.PaginatedMenuBuilder = PaginatedMenuBuilder;
