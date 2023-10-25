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
var _a = require('discord.js'), EmbedBuilder = _a.EmbedBuilder, inlineCode = _a.inlineCode, AttachmentBuilder = _a.AttachmentBuilder;
var _b = require("../../utilities.js"), tendieIconCode = _b.tendieIconCode, formatNumber = _b.formatNumber;
var _c = require('../../database/utilities/stockUtilities.js'), getPortfolio = _c.getPortfolio, getPortfolioStock = _c.getPortfolioStock;
module.exports = {
    data: {
        name: 'pf',
        description: 'View your portfolio.'
    },
    execute: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!args[0]) return [3 /*break*/, 5];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, handleDetailReply(message, args)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("Error handling chart reply: ", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [3 /*break*/, 8];
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, handleListReply(message, args)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _a.sent();
                        console.error("Error handling list reply: ", error_2);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    }
};
function handleListReply(message, args) {
    return __awaiter(this, void 0, void 0, function () {
        var portfolio, embed, totalValue, totalChange, _a, _b, _c, _i, stockId, stock, arrow, gainedOrLost, user;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, getPortfolio(message.author.id)];
                case 1:
                    portfolio = _d.sent();
                    embed = new EmbedBuilder()
                        .setColor("Blurple")
                        .setDescription("To view additional info on a stock: ".concat(inlineCode("$pf @user [page#]")));
                    totalValue = 0;
                    totalChange = 0;
                    _a = portfolio;
                    _b = [];
                    for (_c in _a)
                        _b.push(_c);
                    _i = 0;
                    _d.label = 2;
                case 2:
                    if (!(_i < _b.length)) return [3 /*break*/, 5];
                    _c = _b[_i];
                    if (!(_c in _a)) return [3 /*break*/, 4];
                    stockId = _c;
                    stock = portfolio[stockId];
                    arrow = stock.gainOrLoss < 0 ?
                        "<:stockdown:1119370974140301352>" :
                        "<:stockup:1119370943240863745>";
                    gainedOrLost = stock.gainOrLoss < 0 ?
                        "lost" :
                        "gained";
                    return [4 /*yield*/, message.client.users.fetch(stockId)];
                case 3:
                    user = _d.sent();
                    totalValue += Number(stock.total_purchase_price) + Number(stock.gainOrLoss);
                    totalChange += Number(stock.gainOrLoss);
                    embed.addFields({ name: "".concat(arrow, " ").concat(inlineCode(user.username), " ").concat(tendieIconCode, " ").concat(formatNumber(stock.gainOrLoss), " ").concat(gainedOrLost, " all time"),
                        value: "Total shares: :receipt: ".concat(formatNumber(stock.total_shares), "\nTotal invested: ").concat(tendieIconCode, " ").concat(formatNumber(stock.total_purchase_price)) });
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    arrow = totalChange < 0 ?
                        "<:stockdown:1119370974140301352>" :
                        "<:stockup:1119370943240863745>";
                    embed.setTitle("Portfolio :page_with_curl:\nValue: ".concat(tendieIconCode, " ").concat(formatNumber(totalValue), " (").concat(arrow, " ").concat(formatNumber(totalChange), ")"));
                    return [4 /*yield*/, message.reply({ embeds: [embed] })];
                case 6: return [2 /*return*/, _d.sent()];
            }
        });
    });
}
function handleDetailReply(message, args) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var pageNum, stockUser, stockId, portfolioStock, embed, options, _i, portfolioStock_1, stock, formattedDate;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    pageNum = (_a = args.find(function (arg) { return !isNaN(arg); })) !== null && _a !== void 0 ? _a : 1;
                    stockUser = message.mentions.users.first();
                    stockId = stockUser.id;
                    return [4 /*yield*/, getPortfolioStock(message.author.id, stockId, pageNum)];
                case 1:
                    portfolioStock = _b.sent();
                    if (!!(portfolioStock === null || portfolioStock === void 0 ? void 0 : portfolioStock.length)) return [3 /*break*/, 3];
                    return [4 /*yield*/, message.reply("No history.")];
                case 2: return [2 /*return*/, _b.sent()];
                case 3:
                    embed = new EmbedBuilder()
                        .setColor("Blurple")
                        .setTitle("".concat(inlineCode(stockUser.username), " Purchase History :page_with_curl:"));
                    options = {
                        weekday: 'short',
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    };
                    for (_i = 0, portfolioStock_1 = portfolioStock; _i < portfolioStock_1.length; _i++) {
                        stock = portfolioStock_1[_i];
                        formattedDate = stock.purchase_date.toLocaleString('en-US', options);
                        embed.addFields({ name: "".concat(formattedDate), value: "Shares purchased: :receipt: ".concat(formatNumber(stock.shares), "\nPurchase price: ").concat(tendieIconCode, " ").concat(formatNumber(stock.purchase_price)) });
                    }
                    return [4 /*yield*/, message.reply({ embeds: [embed] })];
                case 4: return [2 /*return*/, _b.sent()];
            }
        });
    });
}
