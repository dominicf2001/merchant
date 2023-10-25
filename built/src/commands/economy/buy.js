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
var _a = require("../../database/dbObjects.js"), Users = _a.Users, Items = _a.Items, UserStocks = _a.UserStocks;
var _b = require("../../utilities.js"), tendieIconCode = _b.tendieIconCode, formatNumber = _b.formatNumber;
var _c = require("../../database/utilities/userUtilities.js"), getBalance = _c.getBalance, addBalance = _c.addBalance, usersCache = _c.usersCache;
var getLatestStock = require("../../database/utilities/stockUtilities.js").getLatestStock;
var _d = require('discord.js'), inlineCode = _d.inlineCode, EmbedBuilder = _d.EmbedBuilder;
var Op = require("sequelize").Op;
module.exports = {
    data: {
        name: 'buy',
        description: "Buy an item or a stock.",
        usage: "".concat(inlineCode("$buy [item/@user] [quantity/all]"), "\n For stocks only $buy will always purchase as many as possible and \"$buy all\" is available.")
    },
    execute: function (message, args) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var author, itemName, quantity, user, item, embed, pluralS, items, totalQuantity, maxInventorySize, i;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(message.mentions.users.size == 1)) return [3 /*break*/, 1];
                        author = usersCache.get(message.author.id);
                        if (author.role < 1)
                            throw new Error("Your role is too low to buy stocks. Minimum role is: ".concat(inlineCode("Fakecel")));
                        buyStock(message, args);
                        return [3 /*break*/, 9];
                    case 1:
                        itemName = args.find(function (arg) { return isNaN(arg); });
                        quantity = (_a = args.find(function (arg) { return !isNaN(arg); })) !== null && _a !== void 0 ? _a : 1;
                        if (quantity <= 0) {
                            return [2 /*return*/, message.reply("You can only purchase one or more items.")];
                        }
                        return [4 /*yield*/, Users.findOne({ where: { user_id: message.author.id } })];
                    case 2:
                        user = _c.sent();
                        return [4 /*yield*/, Items.findOne({ where: { name: (_b = {}, _b[Op.like] = itemName, _b) } })];
                    case 3:
                        item = _c.sent();
                        if (!item)
                            return [2 /*return*/, message.reply("That item doesn't exist.")];
                        if (user.role < item.role)
                            return [2 /*return*/, message.reply("Your role is too low to buy this item.")];
                        embed = new EmbedBuilder()
                            .setColor("Blurple");
                        pluralS = quantity > 1 ? "s" : "";
                        if ((item.price * quantity) > getBalance(message.author.id)) {
                            return [2 /*return*/, message.reply("You only have ".concat(tendieIconCode, " ").concat(formatNumber(+getBalance(message.author.id)), " tendies. ").concat(formatNumber(quantity), " ").concat(item.name).concat(pluralS, " costs ").concat(tendieIconCode, " ").concat(formatNumber(item.price * quantity), " tendies."))];
                        }
                        return [4 /*yield*/, user.getItems()];
                    case 4:
                        items = _c.sent();
                        totalQuantity = items.reduce(function (previous, current) {
                            return previous + current["quantity"];
                        }, +quantity);
                        maxInventorySize = 5;
                        if (totalQuantity > maxInventorySize) {
                            return [2 /*return*/, message.reply("You can only store 5 items at a time.")];
                        }
                        addBalance(message.author.id, -(item.price * quantity));
                        i = 0;
                        _c.label = 5;
                    case 5:
                        if (!(i < quantity)) return [3 /*break*/, 8];
                        return [4 /*yield*/, user.addItem(item)];
                    case 6:
                        _c.sent();
                        _c.label = 7;
                    case 7:
                        ++i;
                        return [3 /*break*/, 5];
                    case 8:
                        embed.addFields({
                            name: "".concat(formatNumber(quantity), " ").concat(item.name).concat(pluralS, " bought for ").concat(tendieIconCode, " ").concat(formatNumber(item.price * quantity)),
                            value: ' '
                        });
                        return [2 /*return*/, message.reply({ embeds: [embed] })];
                    case 9: return [2 /*return*/];
                }
            });
        });
    },
};
function buyStock(message, args) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var stockUser, shares, embed, latestStock, balance, pluralS, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    stockUser = message.mentions.users.first();
                    shares = args.includes("all") ? 99999 : (_a = args.find(function (arg) { return !isNaN(arg); })) !== null && _a !== void 0 ? _a : 1;
                    if (shares <= 0) {
                        return [2 /*return*/, message.reply("You can only purchase one or more shares.")];
                    }
                    if (message.author.id == stockUser.id) {
                        return [2 /*return*/, message.reply("You cannot buy your own stock.")];
                    }
                    embed = new EmbedBuilder()
                        .setColor("Blurple");
                    return [4 /*yield*/, getLatestStock(stockUser.id)];
                case 1:
                    latestStock = _b.sent();
                    if (!latestStock) {
                        return [2 /*return*/, message.reply("That stock does not exist.")];
                    }
                    balance = getBalance(message.author.id);
                    if ((latestStock.price * shares) > balance || args.includes('all')) {
                        shares = Math.floor((balance / latestStock.price) * 100) / 100;
                    }
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    addBalance(message.author.id, -(latestStock.price * shares));
                    return [4 /*yield*/, UserStocks.create({
                            user_id: message.author.id,
                            stock_user_id: stockUser.id,
                            purchase_date: Date.now(),
                            shares: shares,
                            purchase_price: latestStock.price
                        })];
                case 3:
                    _b.sent();
                    pluralS = shares > 1 ? "s" : "";
                    embed.addFields({
                        name: "".concat(formatNumber(shares), " share").concat(pluralS, " of ").concat(inlineCode(stockUser.tag), " bought for ").concat(tendieIconCode, " ").concat(formatNumber(latestStock.price * shares)),
                        value: ' '
                    });
                    return [2 /*return*/, message.reply({ embeds: [embed] })];
                case 4:
                    error_1 = _b.sent();
                    console.error(error_1);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
