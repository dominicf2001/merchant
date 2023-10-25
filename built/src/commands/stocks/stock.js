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
var _this = this;
var _a = require('discord.js'), EmbedBuilder = _a.EmbedBuilder, inlineCode = _a.inlineCode, AttachmentBuilder = _a.AttachmentBuilder, ButtonBuilder = _a.ButtonBuilder, ButtonStyle = _a.ButtonStyle, ActionRowBuilder = _a.ActionRowBuilder;
var tendieIconCode = require("../../utilities.js").tendieIconCode;
var _b = require("../../database/utilities/stockUtilities.js"), getLatestStock = _b.getLatestStock, getStockHistory = _b.getStockHistory, latestStocksCache = _b.latestStocksCache, getStockPurchasedShares = _b.getStockPurchasedShares;
var ChartJSNodeCanvas = require('chartjs-node-canvas').ChartJSNodeCanvas;
var moment = require('moment');
var formatNumber = require("../../utilities.js").formatNumber;
var client = require("../../index.js").client;
var width = 3000;
var height = 1400;
var backgroundColour = "white";
module.exports = {
    data: {
        name: 'stock',
        description: 'View stocks.'
    },
    execute: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (message.mentions.users.first()) {
                    try {
                        handleChartReply(message, args);
                    }
                    catch (error) {
                        console.error("Error handling chart reply: ", error);
                    }
                }
                else {
                    try {
                        handleListReply(message, args);
                    }
                    catch (error) {
                        console.error("Error handling list reply: ", error);
                    }
                }
                return [2 /*return*/];
            });
        });
    },
};
function handleChartReply(message, args) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function () {
        var stockUser, interval, intervals, stockHistory, priceList, highestPrice, lowestPrice, currentStock, previousPrice, currentPrice, difference, arrow, lineColor, volume, dateFormat, chartJSNodeCanvas, configuration, image, attachment, embed;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    stockUser = message.mentions.users.first();
                    interval = (_a = args[1]) !== null && _a !== void 0 ? _a : "now";
                    intervals = ['now', 'hour', 'day', 'month'];
                    if (!intervals.includes(interval) && args[1]) {
                        return [2 /*return*/, message.reply("Invalid interval.")];
                    }
                    return [4 /*yield*/, getStockHistory(stockUser.id, interval)];
                case 1:
                    stockHistory = (_f.sent()).reverse();
                    priceList = stockHistory.map(function (h) { return Number(h.dataValues.price); });
                    highestPrice = Math.round(Math.max.apply(Math, priceList));
                    lowestPrice = Math.round(Math.min.apply(Math, priceList));
                    return [4 /*yield*/, getLatestStock(stockUser.id)];
                case 2:
                    currentStock = _f.sent();
                    if (!currentStock) {
                        return [2 /*return*/, message.reply("This stock does not exist.")];
                    }
                    previousPrice = (_c = (_b = stockHistory[stockHistory.length - 2]) === null || _b === void 0 ? void 0 : _b.price) !== null && _c !== void 0 ? _c : 0;
                    currentPrice = (_e = (_d = stockHistory[stockHistory.length - 1]) === null || _d === void 0 ? void 0 : _d.price) !== null && _e !== void 0 ? _e : 0;
                    difference = Number(currentPrice) - Number(previousPrice);
                    arrow = difference < 0 ? "<:stockdown:1119370974140301352>" : "<:stockup:1119370943240863745>";
                    lineColor = difference < 0 ? "rgb(255, 0, 0)" : "rgb(0, 195, 76)";
                    return [4 /*yield*/, getStockPurchasedShares(stockUser.id)];
                case 3:
                    volume = _f.sent();
                    dateFormat = interval === 'hour' ? 'MMM DD, h:mm a' : interval === 'day' ? 'MMM DD' : interval === 'now' ? 'h:mm:ss' : 'MMM';
                    chartJSNodeCanvas = new ChartJSNodeCanvas({ width: width, height: height, backgroundColour: backgroundColour });
                    configuration = {
                        type: 'line',
                        data: {
                            labels: stockHistory.map(function (h) { return moment(h.dataValues[interval]).format(dateFormat); }),
                            datasets: [{
                                    label: "Stock price (".concat(interval, ")"),
                                    data: stockHistory.map(function (h) { return h.price; }),
                                    fill: false,
                                    borderColor: lineColor,
                                    lineTension: 0.1
                                }]
                        },
                        options: {
                            scales: {
                                x: {
                                    ticks: {
                                        font: {
                                            size: 33
                                        }
                                    }
                                },
                                y: {
                                    min: lowestPrice * .97,
                                    max: highestPrice * 1.03,
                                    ticks: {
                                        font: {
                                            size: 36
                                        }
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    labels: {
                                        font: {
                                            size: 60 // this controls the font size of the legend labels
                                        }
                                    }
                                }
                            }
                        }
                    };
                    return [4 /*yield*/, chartJSNodeCanvas.renderToBuffer(configuration)];
                case 4:
                    image = _f.sent();
                    attachment = new AttachmentBuilder(image, 'chart.png');
                    embed = new EmbedBuilder()
                        .setColor("Blurple")
                        .setTitle("".concat(arrow, " ").concat(inlineCode(stockUser.username), " - ").concat(tendieIconCode, " ").concat(formatNumber(currentPrice)))
                        .setDescription("High: ".concat(tendieIconCode, " ").concat(formatNumber(highestPrice), "\nLow: ").concat(tendieIconCode, " ").concat(formatNumber(lowestPrice), "\nVolume: :bar_chart: ").concat(formatNumber(volume)))
                        .setImage('attachment://chart.png');
                    return [2 /*return*/, message.reply({ embeds: [embed], files: [attachment] })];
            }
        });
    });
}
function handleListReply(message, args, isUpdate) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var pageNum, pageSize, startIndex, endIndex, stocks, totalPages, embed, previousBtn, nextBtn, buttons, historiesPromise, histories, i, _i, stocks_1, stock, previousPrice, currentPrice, username, arrow;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    pageNum = (_a = args.find(function (arg) { return !isNaN(arg); })) !== null && _a !== void 0 ? _a : 1;
                    pageSize = 5;
                    startIndex = (pageNum - 1) * pageSize;
                    endIndex = startIndex + pageSize;
                    stocks = Array.from(latestStocksCache.values()).slice(startIndex, endIndex);
                    totalPages = Math.ceil(latestStocksCache.size / pageSize);
                    if (pageNum > totalPages || pageNum < 1)
                        return [2 /*return*/];
                    embed = new EmbedBuilder()
                        .setColor("Blurple")
                        .setTitle("Stocks :chart_with_upwards_trend:")
                        .setDescription("Page ".concat(pageNum, "/").concat(totalPages, "\nTo view additional info on a stock: ").concat(inlineCode("$stock @user")));
                    previousBtn = new ButtonBuilder()
                        .setCustomId('shopPrevious')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageNum == 1);
                    nextBtn = new ButtonBuilder()
                        .setCustomId('stockListNext')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(pageNum == totalPages);
                    buttons = new ActionRowBuilder()
                        .addComponents(previousBtn, nextBtn);
                    historiesPromise = Promise.all(stocks.map(function (s) { return getStockHistory(s.user_id); }));
                    return [4 /*yield*/, historiesPromise];
                case 1:
                    histories = _d.sent();
                    i = 0;
                    _i = 0, stocks_1 = stocks;
                    _d.label = 2;
                case 2:
                    if (!(_i < stocks_1.length)) return [3 /*break*/, 5];
                    stock = stocks_1[_i];
                    previousPrice = (_c = (_b = histories[i][1]) === null || _b === void 0 ? void 0 : _b.price) !== null && _c !== void 0 ? _c : 0;
                    currentPrice = stock.price;
                    return [4 /*yield*/, message.client.users.fetch(stock.user_id)];
                case 3:
                    username = (_d.sent()).username;
                    arrow = (currentPrice - previousPrice) < 0 ?
                        "<:stockdown:1119370974140301352>" :
                        "<:stockup:1119370943240863745>";
                    embed.addFields({ name: "".concat(arrow, " ").concat(inlineCode(username), " - ").concat(tendieIconCode, " ").concat(formatNumber(stock.price)), value: "".concat("Previous:", " ").concat(tendieIconCode, " ").concat(formatNumber(previousPrice)) });
                    ++i;
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    ;
                    if (isUpdate) {
                        return [2 /*return*/, message.update({ embeds: [embed], components: [buttons] })];
                    }
                    else {
                        return [2 /*return*/, message.reply({ embeds: [embed], components: [buttons] })];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
client.on('interactionCreate', function (interaction) { return __awaiter(_this, void 0, void 0, function () {
    var customId, authorId, pageNum;
    return __generator(this, function (_a) {
        if (!interaction.isButton())
            return [2 /*return*/];
        customId = interaction.customId;
        if (!['stockListPrevious', 'stockListNext'].includes(customId))
            return [2 /*return*/];
        authorId = interaction.message.mentions.users.first().id;
        if (interaction.user.id !== authorId)
            return [2 /*return*/];
        pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
        if (customId === 'stockListPrevious') {
            pageNum = Math.max(pageNum - 1, 1);
        }
        else if (customId === 'stockListNext') {
            pageNum = pageNum + 1;
        }
        if (authorId === interaction.user.id) {
            handleListReply(interaction, [pageNum], true);
        }
        return [2 /*return*/];
    });
}); });
