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
var _a = require("../../database/dbObjects.js"), Users = _a.Users, Items = _a.Items;
var inlineCode = require('discord.js').inlineCode;
var addArmor = require('../../database/utilities/userUtilities.js').addArmor;
module.exports = {
    data: {
        name: 'use',
        description: "Use an item.\n".concat(inlineCode("$use [item]"), "\n").concat(inlineCode("$use [item] @target"))
    },
    execute: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            var itemName, user, item, success, cachedItem, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        itemName = args.shift();
                        return [4 /*yield*/, Users.findOne({ where: { user_id: message.author.id } })];
                    case 1:
                        user = _a.sent();
                        return [4 /*yield*/, user.getItem(itemName)];
                    case 2:
                        item = _a.sent();
                        if (!!item) return [3 /*break*/, 4];
                        return [4 /*yield*/, message.reply("You do not have this item!")];
                    case 3: return [2 /*return*/, _a.sent()];
                    case 4:
                        success = false;
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 11, 13, 16]);
                        user.removeItem(item.item);
                        return [4 /*yield*/, message.client.items.get(itemName)];
                    case 6:
                        cachedItem = _a.sent();
                        if (!cachedItem["data"].attack) return [3 /*break*/, 8];
                        return [4 /*yield*/, handleAttackItem(message, args, cachedItem)];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 10];
                    case 8: return [4 /*yield*/, cachedItem.use(message, args)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10:
                        success = true;
                        return [3 /*break*/, 16];
                    case 11:
                        error_1 = _a.sent();
                        console.error(error_1);
                        return [4 /*yield*/, message.reply(error_1.message)];
                    case 12:
                        _a.sent();
                        return [3 /*break*/, 16];
                    case 13:
                        if (!!success) return [3 /*break*/, 15];
                        return [4 /*yield*/, user.addItem(item.item)];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15: return [7 /*endfinally*/];
                    case 16: return [2 /*return*/];
                }
            });
        });
    },
};
function handleAttackItem(message, args, cachedItem) {
    return __awaiter(this, void 0, void 0, function () {
        var target, targetUser, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 7, , 8]);
                    target = message.mentions.members.first();
                    return [4 /*yield*/, Users.findOne({ where: { user_id: target.id } })];
                case 1:
                    targetUser = _a.sent();
                    if (!(cachedItem["data"].attack <= targetUser.armor && (target && target.id !== message.author.id))) return [3 /*break*/, 4];
                    return [4 /*yield*/, addArmor(target.id, -cachedItem["data"].attack)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, message.reply("This user was protected by :shield: armor. It is now broken and they are exposed.")];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, cachedItem.use(message, args)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    throw error_2;
                case 8: return [2 /*return*/];
            }
        });
    });
}
