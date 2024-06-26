import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { Stocks, Users } from "./database/db-objects";
import { promisify } from "util";
import { exec } from "child_process";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { DateTime } from "luxon";
import {
    MENTIONED_ACTIVITY_VALUE,
    MESSAGE_ACTIVITY_VALUE,
    client,
    getRandomInt,
} from "./utilities";
import { updateStockPrices } from "./stock-utilities";
import { StockInterval, isStockInterval } from "./database/datastores/Stocks";
import path from "path";

const execAsync = promisify(exec);

export interface Message {
    id: string;
    type: string;
    timestamp: string;
    timestampEdited: null;
    callEndedTimestamp: null;
    isPinned: boolean;
    content: string;
    author: Author;
    mentions: Author[];
}

export interface Author {
    id: string;
    name: string;
    discriminator: string;
    nickname: string;
    color: string;
    isBot: boolean;
    roles: Role[];
    avatarUrl: string;
}

export interface Role {
    id: string;
    name: string;
    color: string;
    position: number;
}

const SIM_OUT_DIR = "./cache/";

export const api = new Koa();
const router = new Router();

api.use(cors({
    origin: 'http://localhost:5173'
}));

api.use(router.routes()).use(router.allowedMethods()).use(bodyParser());

router.get("/stock/:range", async (ctx) => {
    try {
        // TODO: accept date param
        // const date = DateTime.fromISO(ctx.params.date) ?? DateTime.now();
        const date = DateTime.now().minus({ days: 2 });
        const range = ctx.params.range;
        if (!isStockInterval(range)) {
            ctx.throw("Invalid range", 400);
            return;
        }

        interface IStockEntry {
            price: number;
            date: number;
        }

        interface IStockResponse {
            name: string;
            history: IStockEntry[];
        }

        const stocks = await Stocks.getAll();
        const stockResponses = await Promise.all(
            stocks.map(async (s) => {
                const history = (
                    await Stocks.getStockHistory(s.stock_id, range, date)
                ).map((entry) => {
                    return {
                        price: entry.price,
                        date: new Date(entry.created_date).getTime(),
                    } as IStockEntry;
                });

                const username = (await client.users.fetch(s.stock_id)).username;

                return {
                    name: username,
                    history: history,
                } as IStockResponse;
            }),
        );

        ctx.body = stockResponses;
    } catch (error) {
        console.error("Error when getting stocks: ", error);
        ctx.status = 500;
        ctx.body = error.message;
    }
});

router.post("/sim/guild/:id", async (ctx) => {
    try {
        const guildId = ctx.params.id;
        const outPath = path.join(SIM_OUT_DIR, guildId);

        if (!existsSync(outPath)) {
            console.log("Exporting...");
            const cmd = `discordchatexporter-cli exportguild -g ${guildId} -f Json -o ${outPath}/ --after 2024-06-23 --parallel 8`;
            const { stdout } = await execAsync(cmd);
            console.log(stdout);
        }

        console.log("Reading...");
        const channelFileNames = await readdir(outPath);
        const channels = await Promise.all(
            channelFileNames.map(async (fileName) => {
                const filePath = path.join(outPath, fileName);
                const content = await readFile(filePath, "utf8");
                return JSON.parse(content);
            })
        );

        const messages = channels
            .flatMap((channel) => channel.messages as Message[])
            .sort((a, b) => DateTime.fromISO(a.timestamp).toMillis() - DateTime.fromISO(b.timestamp).toMillis());

        console.log("Simulating...");
        const minuteIncrement = 5;
        let currDate = DateTime.fromISO(messages[0].timestamp);
        let nextTickDate = currDate.plus({ minutes: minuteIncrement });
        const endDate = DateTime.fromISO(messages[messages.length - 1].timestamp);

        for (const currMessage of messages) {
            currDate = DateTime.fromISO(currMessage.timestamp);

            if (currDate >= nextTickDate) {
                await updateStockPrices(currDate);
                nextTickDate = nextTickDate.plus({ minutes: minuteIncrement });
            }

            const authorId = currMessage.author.id;
            const user = await Users.get(authorId);
            if (!user) {
                console.log("Adding user: ", authorId);
                await Users.set(authorId);
                await Stocks.updateStockPrice(authorId, 1, currDate);
            }

            for (const mentionedUser of currMessage.mentions) {
                if (mentionedUser.id !== authorId && !mentionedUser.isBot) {
                    await Users.addActivity(
                        mentionedUser.id,
                        MENTIONED_ACTIVITY_VALUE * getRandomInt(2, 4),
                        currDate
                    );
                }
            }

            await Users.addActivity(
                authorId,
                MESSAGE_ACTIVITY_VALUE * getRandomInt(2, 4),
                currDate
            );

            if (currDate > endDate) break;
        }

        console.log("Complete...");
    } catch (error) {
        console.error("Error during simulation:", error);
        ctx.status = 500;
        ctx.body = error.message;
    }
});
