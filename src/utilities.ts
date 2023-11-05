import { DateTime } from 'luxon';

const OPEN_HOUR: number = 7;
const CLOSE_HOUR: number = 22;
const CURRENCY_EMOJI_CODE: string = "<:tendie:1115074573264764958>"

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

const TIMEZONE: string = 'America/New_York';

export { secondsToHms, getRandomInt, getRandomFloat, formatNumber, marketIsOpen, isAMention, toUpperCaseString, TIMEZONE, OPEN_HOUR, CLOSE_HOUR, CURRENCY_EMOJI_CODE };
