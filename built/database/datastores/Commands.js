"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Commands = void 0;
const DataStore_1 = require("./DataStore");
const discord_js_1 = require("discord.js");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class Commands extends DataStore_1.DataStore {
    behaviors = new discord_js_1.Collection();
    async refreshCache() {
        const foldersPath = path_1.default.join(process.cwd(), 'built/commands');
        const commandFolders = fs_1.default.readdirSync(foldersPath);
        for (const folder of commandFolders) {
            const commandsPath = path_1.default.join(foldersPath, folder);
            const commandFiles = fs_1.default.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath = path_1.default.join(commandsPath, file);
                const commandObj = (await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)))).default;
                if ('data' in commandObj && 'execute' in commandObj) {
                    this.behaviors.set(commandObj.data.command_id, commandObj.execute);
                    this.set(commandObj.data.command_id, commandObj.data);
                }
                else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }
    async execute(command_id, message, args) {
        const execute = this.behaviors.get(command_id);
        await execute(message, args);
    }
    constructor(db) {
        super(db, 'commands', 'command_id');
    }
}
const commands = new Commands(DataStore_1.db);
exports.Commands = commands;
