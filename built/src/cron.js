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
var _a = require("./database/utilities/userUtilities.js"), getBalance = _a.getBalance, getActivity = _a.getActivity, setActivity = _a.setActivity;
var _b = require("./database/utilities/stockUtilities.js"), getPortfolioValue = _b.getPortfolioValue, getStockPurchasedShares = _b.getStockPurchasedShares, setStockPrice = _b.setStockPrice, getAllLatestStocks = _b.getAllLatestStocks;
var getRandomFloat = require("./utilities.js").getRandomFloat;
var getNetWorth = require("./database/utilities/userUtilities.js").getNetWorth;
var fs = require('fs');
var path = require('path');
var _c = require("./database/dbObjects.js"), Users = _c.Users, Stocks = _c.Stocks;
var _d = require("sequelize"), Op = _d.Op, Sequelize = _d.Sequelize;
var sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: './database/database.sqlite'
});
var WEIGHTS = {
    share: 0.02,
    activity: 0.07,
    random: 0.04,
    netWorth: 0.01,
    price: 0.92
};
var BASE_PRICE = 29;
var SCALING_FACTOR = 20;
var DECAY_RATE = 0.006;
function getRandomFactor() {
    var direction = Math.random() < 0.5 ? -1 : 1;
    return getRandomFloat(10, 50) * direction;
}
function calculateDecayedActivity(activity, lastActiveTime) {
    var currentTime = Date.now();
    var timeDifference = currentTime - lastActiveTime;
    var timeDifferenceInHours = timeDifference / 1000 / 60 / 60;
    var decayedActivity = activity * Math.exp(-DECAY_RATE * timeDifferenceInHours);
    return decayedActivity;
}
function calculateAmount(weights, purchasedShares, activity, randomFactor, netWorth, stockPrice, shockFactor) {
    var weightedSum = (purchasedShares * weights.share +
        activity +
        randomFactor * weights.random +
        netWorth * weights.netWorth +
        stockPrice * weights.price +
        shockFactor);
    var weightedDivisor = (weights.share + weights.activity + weights.random + weights.netWorth + weights.price);
    var amount = BASE_PRICE + weightedSum / weightedDivisor;
    return amount < 0 ? 0 : amount;
}
var shockFactors = {};
var shockIntensities = {};
function getShockFactorForStock(stockId) {
    var chance = Math.random();
    if (shockFactors[stockId] === undefined || shockFactors[stockId] === 0) {
        if (chance < 0.03) {
            console.log("Shock has occured");
            shockFactors[stockId] = getRandomFloat(-13, -2);
            shockIntensities[stockId] = getRandomFloat(0.70, 0.95);
        }
        else if (chance < 0.05) {
            console.log("Shock has occured");
            shockFactors[stockId] = getRandomFloat(2, 13);
            shockIntensities[stockId] = getRandomFloat(0.70, 0.95);
        }
        else {
            shockFactors[stockId] = 0;
            shockIntensities[stockId] = 1;
        }
    }
    return shockFactors[stockId];
}
function calculateAndUpdateStocks() {
    return __awaiter(this, void 0, void 0, function () {
        var latestStocks, _i, latestStocks_1, latestStock, user, activity, lastActiveDate, netWorth, _a, _b, _c, _d, randomFactor, purchasedShares, _e, _f, _g, _h, shockFactorForThisStock, amount, error_1;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    console.log("Recalculating stocks...");
                    _j.label = 1;
                case 1:
                    _j.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, getAllLatestStocks()];
                case 2:
                    latestStocks = _j.sent();
                    _i = 0, latestStocks_1 = latestStocks;
                    _j.label = 3;
                case 3:
                    if (!(_i < latestStocks_1.length)) return [3 /*break*/, 8];
                    latestStock = latestStocks_1[_i];
                    return [4 /*yield*/, Users.findOne({
                            where: {
                                user_id: latestStock.user_id
                            }
                        })];
                case 4:
                    user = _j.sent();
                    if (!user)
                        return [3 /*break*/, 7];
                    activity = getActivity(user.user_id);
                    lastActiveDate = user.last_active_date ? new Date(user.last_active_date) : new Date();
                    activity = calculateDecayedActivity(activity, lastActiveDate);
                    _a = SCALING_FACTOR;
                    _c = (_b = Math).log;
                    _d = 1;
                    return [4 /*yield*/, getNetWorth(user.user_id)];
                case 5:
                    netWorth = _a * _c.apply(_b, [_d + (_j.sent())]);
                    randomFactor = getRandomFactor();
                    _e = SCALING_FACTOR;
                    _g = (_f = Math).log;
                    _h = 1;
                    return [4 /*yield*/, getStockPurchasedShares(user.user_id)];
                case 6:
                    purchasedShares = _e * _g.apply(_f, [_h + (_j.sent())]);
                    shockFactorForThisStock = getShockFactorForStock(latestStock.id);
                    amount = calculateAmount(WEIGHTS, purchasedShares, activity, randomFactor, netWorth, latestStock.price, shockFactorForThisStock);
                    setStockPrice(user.user_id, Math.round(amount));
                    setActivity(user.user_id, activity);
                    if (shockFactorForThisStock !== 0) {
                        shockFactors[latestStock.id] *= shockIntensities[latestStock.id];
                        if (Math.abs(shockFactors[latestStock.id]) < 0.01) {
                            shockFactors[latestStock.id] = 0;
                        }
                    }
                    _j.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8:
                    console.log("Finished recalculating stocks.");
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _j.sent();
                    console.error(error_1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function stockCleanUp() {
    return __awaiter(this, void 0, void 0, function () {
        var distinctDatesAndUsers, _i, distinctDatesAndUsers_1, item, user_id, dateOnly, nextDay, t, latestStock, error_2, srcPath, destPath;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Stocks.findAll({
                        attributes: [
                            [Sequelize.fn('date', Sequelize.col('date')), 'dateOnly'],
                            'user_id'
                        ],
                        group: ['dateOnly', 'user_id'],
                        raw: true
                    })];
                case 1:
                    distinctDatesAndUsers = _c.sent();
                    _i = 0, distinctDatesAndUsers_1 = distinctDatesAndUsers;
                    _c.label = 2;
                case 2:
                    if (!(_i < distinctDatesAndUsers_1.length)) return [3 /*break*/, 12];
                    item = distinctDatesAndUsers_1[_i];
                    user_id = item.user_id, dateOnly = item.dateOnly;
                    nextDay = new Date(dateOnly);
                    nextDay.setDate(nextDay.getDate() + 1);
                    return [4 /*yield*/, sequelize.transaction()];
                case 3:
                    t = _c.sent();
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 9, , 11]);
                    return [4 /*yield*/, Stocks.findOne({
                            where: {
                                user_id: user_id,
                                date: (_a = {},
                                    _a[Op.gte] = Sequelize.fn('date', dateOnly),
                                    _a[Op.lt] = Sequelize.fn('date', nextDay.toISOString()),
                                    _a)
                            },
                            order: [['date', 'DESC']],
                            attributes: ['date'],
                            transaction: t
                        })];
                case 5:
                    latestStock = _c.sent();
                    if (!latestStock) return [3 /*break*/, 7];
                    return [4 /*yield*/, Stocks.destroy({
                            where: {
                                user_id: user_id,
                                date: (_b = {},
                                    _b[Op.gte] = Sequelize.fn('date', dateOnly),
                                    _b[Op.lt] = Sequelize.fn('date', nextDay.toISOString()),
                                    _b[Op.ne] = latestStock.date,
                                    _b)
                            },
                            transaction: t
                        })];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7: return [4 /*yield*/, t.commit()];
                case 8:
                    _c.sent();
                    return [3 /*break*/, 11];
                case 9:
                    error_2 = _c.sent();
                    return [4 /*yield*/, t.rollback()];
                case 10:
                    _c.sent();
                    throw error_2;
                case 11:
                    _i++;
                    return [3 /*break*/, 2];
                case 12:
                    srcPath = path.join(__dirname, './database/database.sqlite');
                    destPath = path.join(__dirname, './database/database_backup.sqlite');
                    fs.copyFile(srcPath, destPath, function (err) {
                        if (err) {
                            console.error('Error while creating backup:', err);
                        }
                        else {
                            console.log('Database backup was created successfully.');
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
module.exports = { calculateAndUpdateStocks: calculateAndUpdateStocks, stockCleanUp: stockCleanUp };
