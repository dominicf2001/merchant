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
var Users = require('../dbObjects.js').Users;
var Collection = require('discord.js').Collection;
var getPortfolioValue = require("./stockUtilities.js").getPortfolioValue;
var usersCache = new Collection();
function addBalance(id, amount, t) {
    return __awaiter(this, void 0, void 0, function () {
        var user, newUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amount = Number(amount);
                    user = usersCache.get(id);
                    if (user) {
                        user.balance = Number(user.balance) + amount;
                        if (user.balance < 0)
                            user.balance = 0;
                        return [2 /*return*/, t ? user.save({ transaction: t }) : user.save()];
                    }
                    return [4 /*yield*/, (t ? Users.create({ user_id: id, balance: (amount < 0 ? 0 : amount) }, { transaction: t }) : Users.create({ user_id: id, balance: amount }))];
                case 1:
                    newUser = _a.sent();
                    usersCache.set(id, newUser);
                    return [2 /*return*/, newUser];
            }
        });
    });
}
function setBalance(id, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var user, newUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    amount = Number(amount);
                    user = usersCache.get(id);
                    if (user) {
                        user.balance = amount;
                        return [2 /*return*/, user.save()];
                    }
                    return [4 /*yield*/, Users.create({ user_id: id, balance: amount })];
                case 1:
                    newUser = _a.sent();
                    usersCache.set(id, newUser);
                    return [2 /*return*/, newUser];
            }
        });
    });
}
function getBalance(id) {
    var user = usersCache.get(id);
    user.balance = Math.floor(user.balance);
    return user ? user.balance : 0;
}
function addArmor(id, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            user = usersCache.get(id);
            if (user) {
                user.armor += amount;
                if (user.armor < 0)
                    user.armor = 0;
                if (user.armor > 1)
                    user.armor = 1;
                return [2 /*return*/, user.save()];
            }
            return [2 /*return*/];
        });
    });
}
function getNetWorth(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var portfolioValue, balance;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getPortfolioValue(userId)];
                case 1:
                    portfolioValue = _a.sent();
                    balance = getBalance(userId);
                    return [2 /*return*/, portfolioValue + balance];
            }
        });
    });
}
function getActivity(id) {
    var user = usersCache.get(id);
    return user ? user.activity : 0;
}
function addActivity(id, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var user, now, newUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = usersCache.get(id);
                    if (user) {
                        now = new Date();
                        user.activity += Math.round(Number(amount));
                        user.last_active_date = now.toISOString();
                        return [2 /*return*/, user.save({ fields: ['activity', 'last_active_date'] })];
                    }
                    return [4 /*yield*/, Users.create({ user_id: id, activity: amount })];
                case 1:
                    newUser = _a.sent();
                    usersCache.set(id, newUser);
                    return [2 /*return*/, newUser];
            }
        });
    });
}
function setActivity(id, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var user, newUser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    user = usersCache.get(id);
                    if (user) {
                        user.activity = Number(amount);
                        return [2 /*return*/, user.save()];
                    }
                    return [4 /*yield*/, Users.create({ user_id: id, activity: amount })];
                case 1:
                    newUser = _a.sent();
                    usersCache.set(id, newUser);
                    return [2 /*return*/, newUser];
            }
        });
    });
}
function updateUserRoleLevel(guild, user, newRole) {
    return __awaiter(this, void 0, void 0, function () {
        var roles, userExists, member, _a, _b, _c, _i, role;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!user)
                        return [2 /*return*/];
                    roles = {
                        Truecel: { id: '1130640195641954374', rank: 4 },
                        Incel: { id: '1130640351565189141', rank: 3 },
                        Chud: { id: '1130640517118562344', rank: 2 },
                        Fakecel: { id: '1130640761302552707', rank: 1 },
                        Normie: { id: '1130640850771251250', rank: 0 }
                    };
                    if (!roles[newRole])
                        throw new Error("Invalid role.");
                    return [4 /*yield*/, guild.members.resolve(user.user_id)];
                case 1:
                    userExists = _d.sent();
                    if (!userExists)
                        return [2 /*return*/];
                    return [4 /*yield*/, guild.members.fetch(user.user_id)];
                case 2:
                    member = _d.sent();
                    _a = roles;
                    _b = [];
                    for (_c in _a)
                        _b.push(_c);
                    _i = 0;
                    _d.label = 3;
                case 3:
                    if (!(_i < _b.length)) return [3 /*break*/, 6];
                    _c = _b[_i];
                    if (!(_c in _a)) return [3 /*break*/, 5];
                    role = _c;
                    if (!member.roles.cache.has(roles[role]["id"])) return [3 /*break*/, 5];
                    return [4 /*yield*/, member.roles.remove(roles[role]["id"])];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, member.roles.add(roles[newRole]["id"])];
                case 7:
                    _d.sent();
                    usersCache.get(user.user_id).role = roles[newRole]["rank"];
                    user.role = roles[newRole]["rank"];
                    return [4 /*yield*/, user.save()];
                case 8:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
module.exports = { setBalance: setBalance, addBalance: addBalance, getBalance: getBalance, getActivity: getActivity, usersCache: usersCache, addActivity: addActivity, updateUserRoleLevel: updateUserRoleLevel, setActivity: setActivity, getNetWorth: getNetWorth, addArmor: addArmor };
