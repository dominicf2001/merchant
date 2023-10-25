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
var _a = require("../../database/dbObjects.js"), Users = _a.Users, UserStocks = _a.UserStocks;
var _b = require("../../utilities.js"), tendieIconCode = _b.tendieIconCode, formatNumber = _b.formatNumber;
var addBalance = require("../../database/utilities/userUtilities.js").addBalance;
var getLatestStock = require("../../database/utilities/stockUtilities.js").getLatestStock;
var _c = require('discord.js'), inlineCode = _c.inlineCode, EmbedBuilder = _c.EmbedBuilder;
module.exports = {
    data: {
        name: 'sell',
        description: "sell an item or a stock.\n".concat(inlineCode("$sell [item/@user] [quantity/all]"))
    },
    execute: function (message, args) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var itemName, quantity, user, item, embed, pluralS, i;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(message.mentions.users.size == 1)) return [3 /*break*/, 1];
                        sellStock(message, args);
                        return [3 /*break*/, 8];
                    case 1:
                        itemName = args.find(function (arg) { return isNaN(arg) && arg !== "all"; });
                        quantity = args.includes("all") ? 10 : (_a = args.find(function (arg) { return !isNaN(arg); })) !== null && _a !== void 0 ? _a : 1;
                        return [4 /*yield*/, Users.findOne({ where: { user_id: message.author.id } })];
                    case 2:
                        user = _b.sent();
                        return [4 /*yield*/, user.getItem(itemName)];
                    case 3:
                        item = _b.sent();
                        if (!item)
                            return [2 /*return*/, message.reply("You do not have this item.")];
                        if (quantity <= 0) {
                            return [2 /*return*/, message.reply("You can only sell one or more items.")];
                        }
                        if (quantity > item.quantity || args.includes("all")) {
                            quantity = item.quantity;
                        }
                        embed = new EmbedBuilder()
                            .setColor("Blurple");
                        pluralS = quantity > 1 ? "s" : "";
                        addBalance(message.author.id, item.item.price * quantity);
                        i = 0;
                        _b.label = 4;
                    case 4:
                        if (!(i < quantity)) return [3 /*break*/, 7];
                        return [4 /*yield*/, user.removeItem(item.item)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6:
                        ++i;
                        return [3 /*break*/, 4];
                    case 7:
                        embed.addFields({
                            name: "".concat(formatNumber(quantity), " ").concat(item.item.name).concat(pluralS, " sold for ").concat(tendieIconCode, " ").concat(formatNumber(item.item.price * quantity)),
                            value: ' '
                        });
                        return [2 /*return*/, message.reply({ embeds: [embed] })];
                    case 8: return [2 /*return*/];
                }
            });
        });
    },
};
function sellStock(message, args) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var stockUser, latestStock, userStocks, totalShares, shares, totalSharesSold, i, userStock, pluralS, embed, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    stockUser = message.mentions.users.first();
                    return [4 /*yield*/, getLatestStock(stockUser.id)];
                case 1:
                    latestStock = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 11, , 12]);
                    return [4 /*yield*/, UserStocks.findAll({
                            where: { user_id: message.author.id, stock_user_id: stockUser.id },
                            order: [['purchase_date', 'ASC']],
                        })];
                case 3:
                    userStocks = _b.sent();
                    if (!userStocks.length)
                        return [2 /*return*/, message.reply("You do not have any shares of this stock.")];
                    totalShares = userStocks.reduce(function (total, stock) { return total + Number(stock.shares); }, 0);
                    shares = args.includes("all") ? totalShares : (_a = args.find(function (arg) { return !isNaN(arg); })) !== null && _a !== void 0 ? _a : 1;
                    if (shares <= 0) {
                        return [2 /*return*/, message.reply("You can only sell one or more stocks.")];
                    }
                    totalSharesSold = 0;
                    i = 0;
                    _b.label = 4;
                case 4:
                    if (!(i < userStocks.length)) return [3 /*break*/, 9];
                    if (shares <= 0)
                        return [3 /*break*/, 9];
                    userStock = userStocks[i];
                    if (!(Number(userStock.shares) > shares)) return [3 /*break*/, 6];
                    totalSharesSold += shares;
                    userStock.shares -= shares;
                    shares = 0;
                    return [4 /*yield*/, userStock.save()];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 8];
                case 6:
                    totalSharesSold += Number(userStock.shares);
                    shares -= Number(userStock.shares);
                    return [4 /*yield*/, userStock.destroy()];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8:
                    i++;
                    return [3 /*break*/, 4];
                case 9: return [4 /*yield*/, addBalance(message.author.id, Number(latestStock.price * totalSharesSold))];
                case 10:
                    _b.sent();
                    pluralS = totalSharesSold > 1 ? "s" : "";
                    embed = new EmbedBuilder()
                        .setColor("Blurple")
                        .addFields({
                        name: "".concat(formatNumber(totalSharesSold), " share").concat(pluralS, " of ").concat(inlineCode(stockUser.tag), " sold for ").concat(tendieIconCode, " ").concat(formatNumber(latestStock.price * totalSharesSold)),
                        value: ' '
                    });
                    return [2 /*return*/, message.reply({ embeds: [embed] })];
                case 11:
                    error_1 = _b.sent();
                    console.error(error_1);
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
