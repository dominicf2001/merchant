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
var Collection = require("discord.js").Collection;
var _a = require('sequelize'), Op = _a.Op, fn = _a.fn, col = _a.col, Sequelize = _a.Sequelize;
var sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: './database/database.sqlite'
});
var _b = require("../dbObjects.js"), Stocks = _b.Stocks, UserStocks = _b.UserStocks;
var latestStocksCache = new Collection();
function getPortfolioValue(id) {
    return __awaiter(this, void 0, void 0, function () {
        var portfolio, totalValue, stockId, stock;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPortfolio(id)];
                case 1:
                    portfolio = _a.sent();
                    totalValue = 0;
                    for (stockId in portfolio) {
                        stock = portfolio[stockId];
                        totalValue += Number(stock.total_purchase_price) + Number(stock.gainOrLoss);
                    }
                    return [2 /*return*/, Math.floor(totalValue)];
            }
        });
    });
}
function getPortfolio(id) {
    return __awaiter(this, void 0, void 0, function () {
        var userStocks, portfolio, _i, userStocks_1, userStock, latestStock, stockUserId, stock, totalCurrentValue, gainOrLoss, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, UserStocks.findAll({
                            where: { user_id: id }
                        })];
                case 1:
                    userStocks = _a.sent();
                    portfolio = {};
                    _i = 0, userStocks_1 = userStocks;
                    _a.label = 2;
                case 2:
                    if (!(_i < userStocks_1.length)) return [3 /*break*/, 5];
                    userStock = userStocks_1[_i];
                    return [4 /*yield*/, getLatestStock(userStock.stock_user_id)];
                case 3:
                    latestStock = _a.sent();
                    if (!portfolio[userStock.stock_user_id]) {
                        portfolio[userStock.stock_user_id] = {
                            total_shares: 0,
                            total_purchase_price: 0,
                            current_price: latestStock.price
                        };
                    }
                    portfolio[userStock.stock_user_id].total_shares += userStock.shares;
                    portfolio[userStock.stock_user_id].total_purchase_price += userStock.purchase_price * userStock.shares;
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    for (stockUserId in portfolio) {
                        stock = portfolio[stockUserId];
                        totalCurrentValue = stock.total_shares * stock.current_price;
                        gainOrLoss = totalCurrentValue - stock.total_purchase_price;
                        stock.gainOrLoss = gainOrLoss;
                    }
                    return [2 /*return*/, portfolio];
                case 6:
                    error_1 = _a.sent();
                    console.error(error_1);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function getStockPurchasedShares(id) {
    return __awaiter(this, void 0, void 0, function () {
        var sum, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, UserStocks.sum('shares', {
                            where: {
                                stock_user_id: id
                            }
                        })];
                case 1:
                    sum = _a.sent();
                    if (!sum || sum < 0)
                        sum = 0;
                    return [2 /*return*/, sum];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error while calculating the shares sum:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getPortfolioStock(userId, stockId, page) {
    if (page === void 0) { page = 1; }
    return __awaiter(this, void 0, void 0, function () {
        var offset;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    offset = (page - 1) * 5;
                    return [4 /*yield*/, UserStocks.findAll({
                            where: { user_id: userId, stock_user_id: stockId },
                            order: [
                                ['purchase_date', 'DESC']
                            ],
                            offset: offset,
                            limit: 5
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
function setStockPrice(id, price) {
    return __awaiter(this, void 0, void 0, function () {
        var stock, newStock, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, getLatestStock(id)];
                case 1:
                    stock = _a.sent();
                    if (!stock) {
                        throw new Error("This stock does not exist.");
                    }
                    return [4 /*yield*/, Stocks.create({
                            user_id: id,
                            price: +price,
                            highest_price: Number(price) > Number(stock.highest_price) ? +price : +stock.highest_price
                        })];
                case 2:
                    newStock = _a.sent();
                    latestStocksCache.set(id, newStock);
                    return [2 /*return*/, newStock];
                case 3:
                    error_3 = _a.sent();
                    console.error("Error setting stock price: ", error_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
;
function getLatestStock(id) {
    try {
        return latestStocksCache.get(id);
    }
    catch (error) {
        console.error("Error getting latest stock: ", error);
    }
}
;
function getAllLatestStocks() {
    return __awaiter(this, void 0, void 0, function () {
        var stocks, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, sequelize.query("\n            SELECT s1.*\n            FROM stocks s1\n            JOIN (\n                SELECT user_id, MAX(date) AS max_date\n                FROM stocks\n                GROUP BY user_id\n            ) s2 ON s1.user_id = s2.user_id AND s1.date = s2.max_date\n            ORDER BY s1.date DESC\n            ", { type: sequelize.QueryTypes.SELECT })];
                case 1:
                    stocks = _a.sent();
                    return [2 /*return*/, stocks];
                case 2:
                    error_4 = _a.sent();
                    console.error("Error getting all latest stocks: ", error_4);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
;
function getStockHistory(id, interval) {
    return __awaiter(this, void 0, void 0, function () {
        var stockHistory, _a, nowMinusTenMinutes, maxHourDates, hours, hourDates, maxDayDates, days, dayDates, maxMonthDates, months, monthDates, error_5;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        return __generator(this, function (_m) {
            switch (_m.label) {
                case 0:
                    _m.trys.push([0, 15, , 16]);
                    stockHistory = void 0;
                    _a = interval;
                    switch (_a) {
                        case 'now': return [3 /*break*/, 1];
                        case 'hour': return [3 /*break*/, 3];
                        case 'day': return [3 /*break*/, 6];
                        case 'month': return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 12];
                case 1:
                    nowMinusTenMinutes = new Date(Date.now() - 120 * 60 * 1000);
                    return [4 /*yield*/, Stocks.findAll({
                            attributes: [
                                'user_id',
                                [fn('strftime', '%Y-%m-%d %H:%M:%S', col('date')), 'now'],
                                'price',
                                'purchased_shares',
                                'highest_price'
                            ],
                            where: {
                                user_id: id,
                                date: (_b = {},
                                    _b[Op.gte] = nowMinusTenMinutes,
                                    _b)
                            },
                            group: ['now', 'user_id'],
                            order: [
                                ['now', 'DESC']
                            ],
                            limit: 30,
                            subQuery: false
                        })];
                case 2:
                    stockHistory = _m.sent();
                    return [3 /*break*/, 14];
                case 3: return [4 /*yield*/, Stocks.findAll({
                        attributes: [
                            [fn('strftime', '%Y-%m-%d %H:00', col('date')), 'hour'],
                            [fn('max', col('date')), 'max_date']
                        ],
                        where: {
                            user_id: id
                        },
                        group: ['hour'],
                        raw: true
                    })];
                case 4:
                    maxHourDates = _m.sent();
                    hours = maxHourDates.map(function (date) { return date.hour; });
                    hourDates = maxHourDates.map(function (date) { return date.max_date; });
                    return [4 /*yield*/, Stocks.findAll({
                            attributes: [
                                'user_id',
                                [fn('strftime', '%Y-%m-%d %H:00', col('date')), 'hour'],
                                'price',
                                'purchased_shares',
                                'highest_price'
                            ],
                            where: (_c = {
                                    user_id: id
                                },
                                _c[Op.and] = [
                                    sequelize.where(fn('strftime', '%Y-%m-%d %H:00', col('date')), (_d = {}, _d[Op.in] = hours, _d)),
                                    { date: (_e = {}, _e[Op.in] = hourDates, _e) }
                                ],
                                _c),
                            group: ['hour', 'user_id'],
                            order: [
                                ['hour', 'DESC']
                            ],
                            subQuery: false,
                            limit: 24
                        })];
                case 5:
                    stockHistory = _m.sent();
                    return [3 /*break*/, 14];
                case 6: return [4 /*yield*/, Stocks.findAll({
                        attributes: [
                            [fn('strftime', '%Y-%m-%d', col('date')), 'day'],
                            [fn('max', col('date')), 'max_date']
                        ],
                        where: {
                            user_id: id
                        },
                        group: ['day'],
                        raw: true
                    })];
                case 7:
                    maxDayDates = _m.sent();
                    days = maxDayDates.map(function (date) { return date.day; });
                    dayDates = maxDayDates.map(function (date) { return date.max_date; });
                    return [4 /*yield*/, Stocks.findAll({
                            attributes: [
                                'user_id',
                                [fn('strftime', '%Y-%m-%d', col('date')), 'day'],
                                'price',
                                'purchased_shares',
                                'highest_price'
                            ],
                            where: (_f = {
                                    user_id: id
                                },
                                _f[Op.and] = [
                                    sequelize.where(fn('strftime', '%Y-%m-%d', col('date')), (_g = {}, _g[Op.in] = days, _g)),
                                    { date: (_h = {}, _h[Op.in] = dayDates, _h) }
                                ],
                                _f),
                            group: ['day', 'user_id'],
                            order: [
                                ['day', 'DESC']
                            ],
                            limit: 30,
                            subQuery: false
                        })];
                case 8:
                    stockHistory = _m.sent();
                    return [3 /*break*/, 14];
                case 9: return [4 /*yield*/, Stocks.findAll({
                        attributes: [
                            [fn('strftime', '%Y-%m', col('date')), 'month'],
                            [fn('max', col('date')), 'max_date']
                        ],
                        where: {
                            user_id: id
                        },
                        group: ['month'],
                        raw: true
                    })];
                case 10:
                    maxMonthDates = _m.sent();
                    months = maxMonthDates.map(function (date) { return date.month; });
                    monthDates = maxMonthDates.map(function (date) { return date.max_date; });
                    return [4 /*yield*/, Stocks.findAll({
                            attributes: [
                                'user_id',
                                [fn('strftime', '%Y-%m', col('date')), 'month'],
                                'price',
                                'purchased_shares',
                                'highest_price'
                            ],
                            where: (_j = {
                                    user_id: id
                                },
                                _j[Op.and] = [
                                    sequelize.where(fn('strftime', '%Y-%m', col('date')), (_k = {}, _k[Op.in] = months, _k)),
                                    { date: (_l = {}, _l[Op.in] = monthDates, _l) }
                                ],
                                _j),
                            group: ['month', 'user_id'],
                            order: [
                                ['month', 'DESC']
                            ],
                            subQuery: false,
                            limit: 6
                        })];
                case 11:
                    stockHistory = _m.sent();
                    return [3 /*break*/, 14];
                case 12: return [4 /*yield*/, Stocks.findAll({
                        where: {
                            user_id: id
                        },
                        order: [
                            ['date', 'DESC']
                        ],
                    })];
                case 13:
                    stockHistory = _m.sent();
                    _m.label = 14;
                case 14: return [2 /*return*/, stockHistory];
                case 15:
                    error_5 = _m.sent();
                    console.error("Error getting stock history: ".concat(error_5));
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
;
module.exports = { setStockPrice: setStockPrice, getLatestStock: getLatestStock, getStockHistory: getStockHistory, getStockPurchasedShares: getStockPurchasedShares, latestStocksCache: latestStocksCache, getAllLatestStocks: getAllLatestStocks, getPortfolio: getPortfolio, getPortfolioStock: getPortfolioStock, getPortfolioValue: getPortfolioValue };
