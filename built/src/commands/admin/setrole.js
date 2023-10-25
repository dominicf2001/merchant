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
var updateUserRoleLevel = require("../../database/utilities/userUtilities.js").updateUserRoleLevel;
var _a = require('discord.js'), EmbedBuilder = _a.EmbedBuilder, inlineCode = _a.inlineCode;
var client = require("../../index.js").client;
var Users = require("../../database/dbObjects.js").Users;
var updateRoles = require("../../rolesCron.js").updateRoles;
module.exports = {
    data: {
        name: 'setrole',
        description: "(ADMIN) Set a users balance.\n".concat(inlineCode("$addbalance @target amount"))
    },
    execute: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            var targetArg, newRole, id, target, guild, embed;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (message.author.id != "608852453315837964") {
                            return [2 /*return*/, message.reply("You do not have permission to use this.")];
                        }
                        targetArg = args.filter(function (arg) { return arg.startsWith('<@') && arg.endsWith('>'); })[0];
                        newRole = args.find(function (arg) { return isNaN(arg) && !arg.startsWith('<@') && !arg.endsWith('>'); });
                        if (!newRole) {
                            return [2 /*return*/, message.reply("You must specify a role.")];
                        }
                        ;
                        newRole = newRole.charAt(0).toUpperCase() + newRole.slice(1);
                        if (!targetArg) {
                            return [2 /*return*/, message.reply('Please specify a target.')];
                        }
                        id = targetArg.slice(2, -1);
                        if (id.startsWith('!')) {
                            id = id.slice(1);
                        }
                        return [4 /*yield*/, Users.findOne({ where: { user_id: id } })];
                    case 1:
                        target = _a.sent();
                        if (!target) {
                            return [2 /*return*/, message.reply('Invalid target specified.')];
                        }
                        if (!target) {
                            return [2 /*return*/, message.reply("You must specify a target.")];
                        }
                        guild = client.guilds.cache.get("608853914535854101");
                        updateUserRoleLevel(guild, target, newRole);
                        embed = new EmbedBuilder()
                            .setColor("Blurple")
                            .setFields({
                            name: "Role set to: ".concat(newRole),
                            value: " "
                        });
                        return [2 /*return*/, message.reply({ embeds: [embed] })];
                }
            });
        });
    }
};
