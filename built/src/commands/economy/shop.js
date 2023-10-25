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
var _a = require('discord.js'), EmbedBuilder = _a.EmbedBuilder, ButtonBuilder = _a.ButtonBuilder, ButtonStyle = _a.ButtonStyle, ActionRowBuilder = _a.ActionRowBuilder;
var tendieIconCode = require("../../utilities.js").tendieIconCode;
var client = require("../../index.js").client;
module.exports = {
    data: {
        name: 'shop',
        description: 'View the shop.'
    },
    execute: function (message, args) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                handleShopReply(message, args);
                return [2 /*return*/];
            });
        });
    },
};
function handleShopReply(message, args, isUpdate) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var pageNum, pageSize, startIndex, endIndex, items, totalPages, roles, embed, previousBtn, nextBtn, buttons;
        return __generator(this, function (_b) {
            pageNum = (_a = args.find(function (arg) { return !isNaN(arg); })) !== null && _a !== void 0 ? _a : 1;
            pageSize = 5;
            startIndex = (pageNum - 1) * pageSize;
            endIndex = startIndex + pageSize;
            items = Array.from(message.client.items.values())
                .sort(function (itemA, itemB) { return itemA.data.price - itemB.data.price; })
                .slice(startIndex, endIndex + 1);
            totalPages = Math.ceil(items.length / pageSize);
            roles = [
                "Truecel",
                "Incel",
                "Chud",
                "Fakecel",
                "Normie"
            ];
            embed = new EmbedBuilder()
                .setColor("Blurple")
                .setTitle("Shop")
                .setDescription("Page ".concat(pageNum, "/").concat(totalPages, "\n----\nTo view additional info on an item, see $help [item].\n----\n"));
            items.forEach(function (item) {
                embed.addFields({ name: "".concat(item.data.icon, " ").concat(item.data.name, " - ").concat(tendieIconCode, " - ").concat(item.data.price, " (").concat(roles[item.data.role], ")"), value: "".concat(item.data.description) });
            });
            if (pageNum > totalPages || pageNum < 1)
                return [2 /*return*/];
            previousBtn = new ButtonBuilder()
                .setCustomId('shopPrevious')
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageNum == 1);
            nextBtn = new ButtonBuilder()
                .setCustomId('shopNext')
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pageNum == totalPages);
            buttons = new ActionRowBuilder()
                .addComponents(previousBtn, nextBtn);
            if (isUpdate) {
                return [2 /*return*/, message.update({ embeds: [embed], components: [buttons] })];
            }
            else {
                return [2 /*return*/, message.reply({ embeds: [embed], components: [buttons] })];
            }
            return [2 /*return*/];
        });
    });
}
client.on('interactionCreate', function (interaction) { return __awaiter(_this, void 0, void 0, function () {
    var customId, authorId, pageNum;
    return __generator(this, function (_a) {
        if (!interaction.isButton())
            return [2 /*return*/];
        customId = interaction.customId;
        if (!['shopPrevious', 'shopNext'].includes(customId))
            return [2 /*return*/];
        authorId = interaction.message.mentions.users.first().id;
        if (interaction.user.id !== authorId)
            return [2 /*return*/];
        pageNum = parseInt(interaction.message.embeds[0].description.match(/Page (\d+)/)[1]);
        if (customId === 'shopPrevious') {
            pageNum = Math.max(pageNum - 1, 1);
        }
        else if (customId === 'shopNext') {
            pageNum = pageNum + 1;
        }
        if (authorId === interaction.user.id) {
            handleShopReply(interaction, [pageNum], true);
        }
        return [2 /*return*/];
    });
}); });
