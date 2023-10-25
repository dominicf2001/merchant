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
module.exports = {
    data: {
        name: 'dye',
        description: "Sets the color of any user's nickname.",
        price: 1500,
        icon: ":art:",
        attack: 1,
        usage: "$use dye [color] @user\n----\nView available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable.",
        role: 1
    },
    use: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            var target, color, newRoleName_1, colorRole, error_1, highestPosition, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        target = message.mentions.members.first();
                        color = args.find(function (arg) { return isNaN(arg) && !arg.startsWith('<@') && !arg.endsWith('>'); });
                        console.log(color);
                        if (!color) {
                            throw new Error('Please specify a color.');
                        }
                        if (!target) {
                            throw new Error('Please specify a target.');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 12, , 13]);
                        newRoleName_1 = 'color' + target.id;
                        return [4 /*yield*/, message.guild.roles.fetch()];
                    case 2:
                        colorRole = (_a.sent()).find(function (role) { return role.name === newRoleName_1; });
                        color = color.charAt(0).toUpperCase() + color.slice(1);
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 8, , 9]);
                        if (!!colorRole) return [3 /*break*/, 5];
                        return [4 /*yield*/, message.guild.roles.create({
                                name: newRoleName_1,
                                color: color,
                                reason: 'Dye item used'
                            })];
                    case 4:
                        colorRole = _a.sent();
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, colorRole.setColor(color)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_1 = _a.sent();
                        throw new Error("This is not a valid color. View available colors here: https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/ColorResolvable.");
                    case 9: return [4 /*yield*/, target.roles.add(colorRole)];
                    case 10:
                        _a.sent();
                        highestPosition = message.guild.roles.highest.position;
                        return [4 /*yield*/, colorRole.setPosition(highestPosition - 1)];
                    case 11:
                        _a.sent();
                        message.channel.send("<@".concat(target.id, ">'s color has been changed to ").concat(color));
                        return [3 /*break*/, 13];
                    case 12:
                        error_2 = _a.sent();
                        console.error(error_2);
                        throw error_2;
                    case 13: return [2 /*return*/];
                }
            });
        });
    }
};
