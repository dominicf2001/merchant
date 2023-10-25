"use strict";
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
exports.client = void 0;
var node_cron_1 = __importDefault(require("node-cron"));
var discord_js_1 = require("discord.js");
var config_json_1 = __importDefault(require("../config.json"));
var dbObjects_1 = require("./database/dbObjects");
var userUtilities_1 = require("./database/utilIties/userUtilities");
var moment_1 = __importDefault(require("moment"));
var utilities_1 = require("./utilities");
var cron_1 = require("./cron");
var dataStore = new DataStore();
var client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMember,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
        discord_js_1.GatewayIntentBits.GuildInvites,
        discord_js_1.GatewayIntentBits.GuildModeration,
        discord_js_1.GatewayIntentBits.GuildIntegrations,
        discord_js_1.GatewayIntentBits.GuildPresences
    ],
});
exports.client = client;
// EVENTS
client.once(discord_js_1.Events.ClientReady, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        dataStore.refreshCaches();
        console.log('Ready as ' + client.user.tag);
        return [2 /*return*/];
    });
}); });
client.on(discord_js_1.Events.InviteCreate, function (invite) {
    if (invite.inviter.bot)
        return;
    var currentHour = Number((0, moment_1.default)().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        (0, userUtilities_1.addActivity)(invite.inviterId, 2);
    }
});
client.on(discord_js_1.Events.MessageReactionAdd, function (_, user) {
    if (user.bot)
        return;
    var currentHour = Number((0, moment_1.default)().utcOffset('-05:00').format('H'));
    if (currentHour >= 7 && currentHour < 22) {
        (0, userUtilities_1.addActivity)(user.id, .3);
    }
});
client.on(discord_js_1.Events.VoiceStateUpdate, function (oldState, newState) {
    if (!oldState.channel && newState.channel && !newState.member.user.bot) {
        var currentHour = Number((0, moment_1.default)().utcOffset('-05:00').format('H'));
        if (currentHour >= 7 && currentHour < 22) {
            (0, userUtilities_1.addActivity)(newState.member.user.id, 1);
        }
    }
});
// COMMAND HANDLING
client.on(discord_js_1.Events.MessageCreate, function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var usersCache, newUser, prefix, currentHour, mentionedUsers, args, commandName, command, now, defaultCooldownDuration, cooldownAmount, userCooldown, expirationTime, expiredTimestampReadable, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                if (message.author.bot)
                    return [2 /*return*/];
                usersCache = dataStore.caches["users"];
                if (!!usersCache.has(message.author.id)) return [3 /*break*/, 2];
                return [4 /*yield*/, dbObjects_1.Users.create({
                        user_id: message.author.id
                    })];
            case 1:
                newUser = _b.sent();
                users.set(message.author.id, newUser);
                _b.label = 2;
            case 2:
                prefix = '$';
                if (!!message.content.startsWith(prefix)) return [3 /*break*/, 3];
                currentHour = Number((0, moment_1.default)().utcOffset('-05:00').format('H'));
                if (currentHour >= 7 && currentHour < 22) {
                    mentionedUsers = message.mentions.users;
                    mentionedUsers.forEach(function (user) {
                        if (user.id != message.author.id && !user.bot) {
                            (0, userUtilities_1.addActivity)(user.id, .5);
                        }
                    });
                    (0, userUtilities_1.addActivity)(message.author.id, (0, utilities_1.getRandomFloat)(.3, .75));
                }
                return [3 /*break*/, 12];
            case 3:
                args = message.content.slice(prefix.length).trim().split(/ +/);
                commandName = args.shift().toLowerCase();
                command = dataStore.caches["commands"].get(commandName);
                if (!command)
                    return [2 /*return*/];
                now = Date.now();
                defaultCooldownDuration = 0;
                cooldownAmount = ((_a = command.cooldown) !== null && _a !== void 0 ? _a : defaultCooldownDuration) * 1000;
                return [4 /*yield*/, dbObjects_1.UserCooldowns.findOne({
                        where: {
                            user_id: message.author.id,
                            command_name: command.data.name
                        }
                    })];
            case 4:
                userCooldown = _b.sent();
                if (!userCooldown) return [3 /*break*/, 7];
                expirationTime = userCooldown.timestamp + cooldownAmount;
                if (!(now < expirationTime)) return [3 /*break*/, 5];
                expiredTimestampReadable = (0, utilities_1.secondsToHms)(Math.round((expirationTime - now) / 1000));
                return [2 /*return*/, message.reply({ content: "Please wait, you are on a cooldown for `".concat(command.data.name, "`. You can use it again in `").concat(expiredTimestampReadable, "`."), ephemeral: true })];
            case 5: return [4 /*yield*/, userCooldown.destroy()];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7:
                _b.trys.push([7, 10, , 12]);
                return [4 /*yield*/, command.execute(message, args)];
            case 8:
                _b.sent();
                // create new cooldown after command execution
                return [4 /*yield*/, dbObjects_1.UserCooldowns.create({
                        user_id: message.author.id,
                        command_name: command.data.name,
                        timestamp: now
                    })];
            case 9:
                // create new cooldown after command execution
                _b.sent();
                return [3 /*break*/, 12];
            case 10:
                error_1 = _b.sent();
                console.error(error_1);
                return [4 /*yield*/, message.reply(error_1.message)];
            case 11:
                _b.sent();
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
var stockTicker = node_cron_1.default.schedule('*/5 7-22 * * *', function () {
    var randomMinute = Math.floor(Math.random() * 5);
    setTimeout(function () {
        (0, cron_1.calculateAndUpdateStocks)();
        client.channels.fetch("1119995339349430423").then(function (channel) { return channel.send("Stocks ticked"); });
        console.log("tick");
    }, randomMinute * 60 * 1000);
}, {
    timezone: "America/New_York"
});
var dailyCleanup = node_cron_1.default.schedule('0 5 * * *', function () {
    (0, cron_1.stockCleanUp)();
    console.log("Cleanup has occurred!");
}, {
    timezone: "America/New_York"
});
stockTicker.start();
dailyCleanup.start();
client.login(config_json_1.default);
