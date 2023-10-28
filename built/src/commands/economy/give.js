var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a = require("../../database/utilities/userUtilities.js"), getBalance = _a.getBalance, addBalance = _a.addBalance;
var _b = require("../../utilities.js"), tendieIconCode = _b.tendieIconCode, formatNumber = _b.formatNumber;
var _c = require('discord.js'), EmbedBuilder = _c.EmbedBuilder, inlineCode = _c.inlineCode;
module.exports = {
    data: {
        name: 'give',
        description: "Share your tendies.\n".concat(inlineCode("$give @target [amount]"))
    },
    execute: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            var currentAmount, transferAmount, transferTarget, embed;
            return __generator(this, function (_a) {
                currentAmount = getBalance(message.author.id);
                transferAmount = args.find(function (arg) { return !isNaN(arg); });
                transferTarget = message.mentions.users.first();
                if (!transferTarget) {
                    throw Error("Please specify a target.");
                }
                if (!transferAmount)
                    return [2 /*return*/, message.reply("Specify how many tendies, ".concat(message.author.username, "."))];
                if (!transferTarget)
                    return [2 /*return*/, message.reply("Mention the user to whom you want to give tendies, ".concat(message.author.username, "."))];
                if (transferAmount > currentAmount)
                    return [2 /*return*/, message.reply("You only have ".concat(tendieIconCode, " ").concat(formatNumber(currentAmount), " tendies."))];
                if (transferAmount <= 0)
                    return [2 /*return*/, message.reply("Enter an amount greater than zero, ".concat(message.author.username, "."))];
                addBalance(message.author.id, -transferAmount);
                addBalance(transferTarget.id, +transferAmount);
                embed = new EmbedBuilder()
                    .setColor("Blurple")
                    .setFields({
                    name: "".concat(tendieIconCode, " ").concat(formatNumber(transferAmount), " transferred to: ").concat(inlineCode(transferTarget.username)),
                    value: "You have ".concat(tendieIconCode, " ").concat(formatNumber(+getBalance(message.author.id)), " remaining")
                });
                return [2 /*return*/, message.reply({ embeds: [embed] })];
            });
        });
    },
};