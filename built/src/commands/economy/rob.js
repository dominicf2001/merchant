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
var _a = require("../../database/utilities/userUtilities.js"), getBalance = _a.getBalance, addBalance = _a.addBalance, usersCache = _a.usersCache;
var _b = require("../../utilities.js"), tendieIconCode = _b.tendieIconCode, formatNumber = _b.formatNumber, getRandomInt = _b.getRandomInt, getRandomFloat = _b.getRandomFloat;
var _c = require('discord.js'), EmbedBuilder = _c.EmbedBuilder, inlineCode = _c.inlineCode;
var Users = require("../../database/dbObjects.js").Users;
module.exports = {
    cooldown: 5,
    data: {
        name: 'rob',
        description: "Rob a user of their tendies or a random item. Chance to fail and lose tendies.\n".concat(inlineCode("$rob @target [tendies/item]"))
    },
    execute: function (message, args) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var robType, author, target, reply, amount, amount, targetUser, targetItems, authorItems, userInvSize, item, amount, embed;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        robType = (_a = args.find(function (arg) { return isNaN(arg) && !arg.startsWith('<@') && !arg.endsWith('>'); })) !== null && _a !== void 0 ? _a : "tendies";
                        author = usersCache.get(message.author.id);
                        if (author.role < 1)
                            throw new Error("Your role is too low to use this command. Minimum role is: ".concat(inlineCode("Fakecel")));
                        target = message.mentions.users.first();
                        if (!target) {
                            throw new Error("Please specify a target.");
                        }
                        if (target.id == author.user_id) {
                            throw new Error("You cannot rob yourself.");
                        }
                        if (robType !== "tendies" && robType !== "item") {
                            throw new Error("Invalid rob type.");
                        }
                        reply = "";
                        if (!(robType == "tendies")) return [3 /*break*/, 1];
                        if (getRandomInt(1, 100) > 70) {
                            amount = getBalance(target.id) * getRandomFloat(.01, .10);
                            addBalance(message.author.id, +amount);
                            addBalance(target.id, -amount);
                            reply = "You have robbed ".concat(tendieIconCode, " ").concat(formatNumber(amount), " from: ").concat(inlineCode(target.username), ".");
                        }
                        else {
                            amount = getBalance(message.author.id) * getRandomFloat(.03, .15);
                            addBalance(message.author.id, -amount);
                            reply = "You failed at robbing ".concat(inlineCode(target.username), ". You have been fined ").concat(tendieIconCode, " ").concat(formatNumber(amount), " ");
                        }
                        return [3 /*break*/, 5];
                    case 1:
                        if (!(robType == "item")) return [3 /*break*/, 5];
                        if (!(getRandomInt(1, 100) > 1)) return [3 /*break*/, 4];
                        targetUser = usersCache.get(target.id);
                        return [4 /*yield*/, targetUser.getItems()];
                    case 2:
                        targetItems = _b.sent();
                        return [4 /*yield*/, author.getItems()];
                    case 3:
                        authorItems = _b.sent();
                        userInvSize = authorItems.reduce(function (previous, current) {
                            return previous + current["quantity"];
                        }, 0);
                        if (userInvSize >= 5)
                            throw new Error("Your inventory is full.");
                        if (!targetItems.length)
                            throw new Error("This user has no items.");
                        item = targetItems[Math.floor(Math.random() * targetItems.length)];
                        item.id = item.item_id;
                        targetUser.removeItem(item);
                        author.addItem(item);
                        reply = "You have robbed ".concat(item.item.name, " from: ").concat(inlineCode(target.username), ".");
                        return [3 /*break*/, 5];
                    case 4:
                        amount = getBalance(message.author.id) * getRandomFloat(.03, .15);
                        addBalance(message.author.id, -amount);
                        reply = "You failed at robbing ".concat(inlineCode(target.username), ". You have been fined ").concat(tendieIconCode, " ").concat(formatNumber(amount), " ");
                        _b.label = 5;
                    case 5:
                        embed = new EmbedBuilder()
                            .setColor("Blurple")
                            .setFields({
                            name: reply,
                            value: " "
                        });
                        return [2 /*return*/, message.reply({ embeds: [embed] })];
                }
            });
        });
    },
};
