//import {
//    Commands as Command,
//    CommandsCommandId,
//} from "../../database/schemas/public/Commands";
//import { Message, inlineCode } from "discord.js";
//import { updateStockPrices } from "../../stock-utilities";
//
//const data: Partial<Command> = {
//    command_id: "tick" as CommandsCommandId,
//    description: `Update all stock prices`,
//    cooldown_time: 0,
//    usage: `${inlineCode("$tick")}`,
//    is_admin: true,
//};
//
//export default {
//    data: data,
//    async execute(message: Message, args: string[]): Promise<void> {
//        await updateStockPrices();
//        await message.reply("Stocks ticked");
//    },
//
//};
