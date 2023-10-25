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
var blacklist = {
    "992276497912049785": 1,
    "1132451468750893199": 2,
    "1132450703495942184": 3,
    "1132458132044533800": 4,
    "1132449807894585466": 5,
    "992277426392539206": 6,
    "992277557334528060": 7,
    "1132450409810759691": 8,
    "1132450460494733342": 9,
    "1028086642675818596": 10,
    "1019786911407161386": 11,
    "1132450487204057129": 12,
    "1132450501498241054": 13,
    "1132452564592492544": 14,
    "992277222352240762": 15,
    "992277306267676732": 16,
    "1132452681110278144": 17
};
module.exports = {
    data: {
        name: 'hammer',
        price: 3000,
        icon: ":hammer:",
        description: "Destroys a channel or emoji.",
        usage: "$use hammer [channel/emoji] [name]",
        role: 3
    },
    use: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            var hammerObject, hammerArgs, _a, emojiName_1, emojiId, channelName_1, channel, channelId, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        hammerObject = args[0];
                        hammerArgs = args.filter(function (arg) { return arg !== hammerObject; });
                        if (!hammerObject) {
                            throw new Error('Please specify a hammer object. See $help hammer for options.');
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        _a = hammerObject;
                        switch (_a) {
                            case "emoji": return [3 /*break*/, 2];
                            case "channel": return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 8];
                    case 2:
                        emojiName_1 = hammerArgs.join(" ");
                        return [4 /*yield*/, message.guild.emojis.fetch()];
                    case 3:
                        emojiId = (_b.sent())
                            .findKey(function (emoji) { return emoji.name == emojiName_1; });
                        return [4 /*yield*/, message.guild.emojis.delete(emojiId)];
                    case 4:
                        _b.sent();
                        message.channel.send("".concat(emojiName_1, " has been demolished."));
                        return [3 /*break*/, 9];
                    case 5:
                        channelName_1 = hammerArgs.join(" ");
                        return [4 /*yield*/, message.guild.channels.fetch()];
                    case 6:
                        channel = (_b.sent())
                            .find(function (channel) { return channel.name == channelName_1; });
                        if (blacklist[channel.parentId]) {
                            throw new Error('This channel cannot be deleted.');
                        }
                        channelId = channel.id;
                        return [4 /*yield*/, message.guild.channels.delete(channelId)];
                    case 7:
                        _b.sent();
                        message.channel.send("".concat(channelName_1, " has been demolished."));
                        return [3 /*break*/, 9];
                    case 8: throw new Error('Invalid hammer object.');
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_1 = _b.sent();
                        console.error(error_1);
                        throw new Error("Hammer error. Make sure that channel or emoji exists.");
                    case 11: return [2 /*return*/];
                }
            });
        });
    }
};
