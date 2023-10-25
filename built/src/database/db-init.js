"use strict";
// const path = require('node:path');
// const fs = require('node:fs');
// const Sequelize = require('sequelize');
// const sequelize = new Sequelize('database', 'username', 'password', {
// 	host: 'localhost',
// 	dialect: 'sqlite',
// 	logging: false,
// 	storage: './database.sqlite'
// });
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.db = void 0;
// const Items = require('./models/Items.js')(sequelize, Sequelize.DataTypes);
// const Stocks = require('./models/Stocks.js')(sequelize, Sequelize.DataTypes);
// const UserStocks = require('./models/UserStocks.js')(sequelize, Sequelize.DataTypes);
// const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
// require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);
// require('./models/UserCooldowns.js')(sequelize, Sequelize.DataTypes);
// const force = process.argv.includes('--force') || process.argv.includes('-f');
// sequelize.sync({ force }).then(async () => {
//     const itemsPath = path.resolve(__dirname, '..', 'items');
//     const itemFiles = fs.readdirSync(itemsPath).filter(file => file.endsWith('.js'));
//     for (const file of itemFiles) {
//         const filePath = path.join(itemsPath, file);
//         const item = require(filePath);
//         if ('data' in item && 'use' in item) {
//             await Items.upsert(item.data);
//         } else {
//             console.log(`[WARNING] The item at ${filePath} is missing a required "data" or "use" property.`);
//         }
//     }
//     console.log('Database synced');
// 	sequelize.close();
// }).catch(console.error);
var luxon_1 = require("luxon");
var pg_1 = require("pg");
var kysely_1 = require("kysely");
var kanel_1 = require("kanel");
var kanelrc_1 = __importDefault(require("./kanelrc"));
var dialect = new kysely_1.PostgresDialect({
    pool: new pg_1.Pool({
        database: 'test',
        host: 'localhost',
        user: 'admin',
        port: 5432,
        max: 10,
    })
});
exports.db = new kysely_1.Kysely({
    dialect: dialect,
});
exports.db.schema.createTable('users')
    .addColumn("id", "varchar", function (col) { return col
    .notNull()
    .primaryKey(); })
    .addColumn("balance", "integer", function (col) { return col
    .notNull()
    .defaultTo(0)
    .check((0, kysely_1.sql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["balance >= 0"], ["balance >= 0"])))); })
    .addColumn("activity_points", "integer", function (col) { return col
    .notNull()
    .defaultTo(0)
    .check((0, kysely_1.sql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["activity_points >= 0"], ["activity_points >= 0"])))); })
    .addColumn("last_active_date", "timestamptz", function (col) { return col
    .notNull()
    .defaultTo(luxon_1.DateTime.now()); })
    .addColumn("armor", "integer", function (col) { return col
    .notNull()
    .defaultTo(0)
    .check((0, kysely_1.sql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["armor >= 0"], ["armor >= 0"])))); })
    .addColumn("role", "integer")
    .execute();
function run() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, kanel_1.processDatabase)(kanelrc_1.default)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
run();
var templateObject_1, templateObject_2, templateObject_3;
