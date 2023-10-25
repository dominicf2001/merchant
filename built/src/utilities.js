"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatNumber = exports.tendieIconCode = exports.getRandomFloat = exports.getRandomInt = exports.secondsToHms = void 0;
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
function formatNumber(num, decimalPlaces) {
    if (decimalPlaces === void 0) { decimalPlaces = 2; }
    return Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
}
exports.formatNumber = formatNumber;
var tendieIconCode = "<:tendie:1115074573264764958>";
exports.tendieIconCode = tendieIconCode;
