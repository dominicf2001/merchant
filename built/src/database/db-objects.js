"use strict";
// const Sequelize = require('sequelize');
// const sequelize = new Sequelize('database', 'username', 'password', {
// 	host: 'localhost',
// 	dialect: 'sqlite',
// 	logging: false,
// 	storage: './database/database.sqlite',
// });
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStocks = exports.Stocks = exports.UserCooldowns = exports.UserItems = exports.Items = exports.Users = void 0;
// const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
// const UserCooldowns = require('./models/UserCooldowns.js')(sequelize, Sequelize.DataTypes);
// const Items = require('./models/Items.js')(sequelize, Sequelize.DataTypes);
// const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
// const Stocks = require('./models/Stocks.js')(sequelize, Sequelize.DataTypes);
// const UserStocks = require('./models/UserStocks.js')(sequelize, Sequelize.DataTypes);
// UserItems.belongsTo(Items, { foreignKey: 'item_id', as: 'item' });
// UserStocks.belongsTo(Users, { foreignKey: 'user_id', as: 'user' });
// UserStocks.belongsTo(Stocks, { foreignKey: 'stock_user_id', as: 'stock' });
// Users.hasMany(UserStocks, { foreignKey: 'user_id' });
// Stocks.hasMany(UserStocks, { foreignKey: 'stock_user_id' });
var discord_js_1 = require("discord.js");
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
// TODO: figure out item and command types
// database type depends on new sql
var DataStore = /** @class */ (function () {
    function DataStore(database) {
        if (database === void 0) { database = null; }
        this.cache = new discord_js_1.Collection();
        this.database = database;
    }
    DataStore.prototype.get = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.cache.has(id)) {
                    return [2 /*return*/, this.cache.get(id)];
                }
                return [2 /*return*/];
            });
        });
    };
    DataStore.prototype.set = function (id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.cache.set(id, data);
                return [2 /*return*/];
            });
        });
    };
    return DataStore;
}());
var Commands = /** @class */ (function (_super) {
    __extends(Commands, _super);
    function Commands() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Commands.prototype.refreshCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var foldersPath, commandFolders, _i, commandFolders_1, folder, commandsPath, commandFiles, _a, commandFiles_1, file, filePath, command;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        foldersPath = path_1.default.join(process.cwd(), 'commands');
                        commandFolders = fs_1.default.readdirSync(foldersPath);
                        _i = 0, commandFolders_1 = commandFolders;
                        _b.label = 1;
                    case 1:
                        if (!(_i < commandFolders_1.length)) return [3 /*break*/, 6];
                        folder = commandFolders_1[_i];
                        commandsPath = path_1.default.join(foldersPath, folder);
                        commandFiles = fs_1.default.readdirSync(commandsPath).filter(function (file) { return file.endsWith('.js'); });
                        _a = 0, commandFiles_1 = commandFiles;
                        _b.label = 2;
                    case 2:
                        if (!(_a < commandFiles_1.length)) return [3 /*break*/, 5];
                        file = commandFiles_1[_a];
                        filePath = path_1.default.join(commandsPath, file);
                        return [4 /*yield*/, Promise.resolve("".concat(filePath)).then(function (s) { return __importStar(require(s)); })];
                    case 3:
                        command = _b.sent();
                        if ('data' in command && 'execute' in command) {
                            this.cache.set(command.data.name, command);
                        }
                        else {
                            console.log("[WARNING] The command at ".concat(filePath, " is missing a required \"data\" or \"execute\" property."));
                        }
                        _b.label = 4;
                    case 4:
                        _a++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return Commands;
}(DataStore));
var Items = /** @class */ (function (_super) {
    __extends(Items, _super);
    function Items() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Items.prototype.refreshCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var itemsPath, itemFiles, _i, itemFiles_1, file, filePath, item;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        itemsPath = path_1.default.join(process.cwd(), 'items');
                        itemFiles = fs_1.default.readdirSync(itemsPath).filter(function (file) { return file.endsWith('.js'); });
                        _i = 0, itemFiles_1 = itemFiles;
                        _a.label = 1;
                    case 1:
                        if (!(_i < itemFiles_1.length)) return [3 /*break*/, 4];
                        file = itemFiles_1[_i];
                        filePath = path_1.default.join(itemsPath, file);
                        return [4 /*yield*/, Promise.resolve("".concat(filePath)).then(function (s) { return __importStar(require(s)); })];
                    case 2:
                        item = _a.sent();
                        if ('data' in item && 'use' in item) {
                            this.cache.set(item.data.name, item);
                        }
                        else {
                            console.log("[WARNING] The item at ".concat(filePath, " is missing a required \"data\" or \"use\" property."));
                        }
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Items;
}(DataStore));
exports.Items = Items;
var Stocks = /** @class */ (function (_super) {
    __extends(Stocks, _super);
    function Stocks() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Stocks.prototype.refreshCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allLatestStocks;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getAllLatestStocks()];
                    case 1:
                        allLatestStocks = _a.sent();
                        allLatestStocks.forEach(function (stock) { return _this.cache.set(stock.user_id, stock); });
                        return [2 /*return*/];
                }
            });
        });
    };
    return Stocks;
}(DataStore));
exports.Stocks = Stocks;
var Users = /** @class */ (function (_super) {
    __extends(Users, _super);
    function Users() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Users.prototype.refreshCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var usersData;
            var _this = this;
            return __generator(this, function (_a) {
                usersData = [];
                usersData.forEach(function (userData) {
                    user: User = ;
                    _this.cache.set(user.user_id, user);
                });
                return [2 /*return*/];
            });
        });
    };
    // TODO: should make a transaction?
    Users.prototype.addBalance = function (id, amount) {
        var user = this.get(id);
        user.balance += amount;
        if (user.balance < 0)
            user.balance = 0;
        this.set(id, user);
    };
    return Users;
}(DataStore));
exports.Users = Users;
Reflect.defineProperty(Users.prototype, 'addItem', {
    value: function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var userItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, UserItems.findOne({
                            where: { user_id: this.user_id, item_id: item.id },
                        })];
                    case 1:
                        userItem = _a.sent();
                        if (userItem) {
                            userItem.quantity += 1;
                            return [2 /*return*/, userItem.save()];
                        }
                        return [2 /*return*/, UserItems.create({ user_id: this.user_id, item_id: item.id, quantity: 1 })];
                }
            });
        });
    },
});
Reflect.defineProperty(Users.prototype, 'removeItem', {
    value: function (item) {
        return __awaiter(this, void 0, void 0, function () {
            var userItem;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, UserItems.findOne({
                            where: { user_id: this.user_id, item_id: item.id },
                        })];
                    case 1:
                        userItem = _a.sent();
                        if (userItem) {
                            userItem.quantity -= 1;
                            if (userItem.quantity <= 0) {
                                return [2 /*return*/, userItem.destroy()];
                            }
                            else {
                                return [2 /*return*/, userItem.save()];
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    },
});
Reflect.defineProperty(Users.prototype, 'getItems', {
    value: function () {
        return UserItems.findAll({
            where: { user_id: this.user_id },
            include: ['item'],
        });
    },
});
Reflect.defineProperty(Users.prototype, 'getItem', {
    value: function (itemName) {
        return UserItems.findOne({
            where: {
                user_id: this.user_id,
                '$item.name$': itemName
            },
            include: [{
                    model: Items,
                    as: 'item',
                }],
        });
    },
});
