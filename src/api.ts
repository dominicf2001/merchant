import Koa from "koa";
import Router from "koa-router";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import { Stocks, Users } from "./database/db-objects";
import { promisify } from "util";
import { exec } from "child_process";
import { existsSync, rmSync } from "fs";
import { readdir, readFile } from "fs/promises";
import { DateTime } from "luxon";
import {
    MENTIONED_ACTIVITY_VALUE,
    MESSAGE_ACTIVITY_VALUE,
    client,
    getRandomInt,
} from "./utilities";
import { updateStockPrices } from "./stock-utilities";
import { isStockInterval } from "./database/datastores/Stocks";
import path from "path";

const execAsync = promisify(exec);

interface Message {
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

interface Author {
    id: string;
    name: string;
    discriminator: string;
    nickname: string;
    color: string;
    isBot: boolean;
    roles: Role[];
    avatarUrl: string;
}

interface Role {
    id: string;
    name: string;
    color: string;
    position: number;
}

interface Guild {
    id: string;
    name: string;
}

interface SimParams {
    guildID: string;
    start: string;
    end: string;
    clearCache: boolean;
}

const SIM_OUT_DIR = "./cache/";

export const api = new Koa();
const router = new Router();

api.use(bodyParser());

let guilds: Guild[] = [];
router.get("/guilds", async (ctx) => {
    if (!guilds.length) {
        const { stdout } = await execAsync("discordchatexporter-cli guilds");
        const guildStrs = stdout.split("\n").slice(1, -1);

        for (const guildStr of guildStrs) {
            const splitStr = guildStr.split("|");
            guilds.push({
                id: splitStr[0].trim(),
                name: splitStr[1].trim()
            })
        }
    }

    ctx.body = guilds;
});

router.get("/stock/:startDate/:range", async (ctx) => {
    try {
        if (!ctx.params.startDate) {
            ctx.throw("Missing start date", 400);
            return;
        }

        if (!isStockInterval(ctx.params.range)) {
            ctx.throw("Invalid or missing range", 400);
            return;
        }

        const startDate = DateTime.fromISO(ctx.params.startDate);
        const range = ctx.params.range;

        interface IStockEntry {
            value: number;
            time: number;
        }

        interface IStockResponse {
            name: string;
            history: IStockEntry[];
        }

        let stocks = await Stocks.getAll();
        // TODO: implement paging
        stocks = stocks.slice(0, 3);
        const stockResponses = (await Promise.all(
            stocks.map(async (s) => {
                try {
                    const username = (await client.users.fetch(s.stock_id)).username;

                    const history = (
                        await Stocks.getStockHistory(s.stock_id, range, startDate)
                    ).map((entry) => {
                        return {
                            value: entry.price,
                            time: new Date(entry.created_date).getTime(),
                        } as IStockEntry;
                    });

                    return {
                        name: username,
                        history: history,
                    } as IStockResponse;
                }
                catch (error) {
                    console.error(error);
                    return {
                        name: "",
                        history: [],
                    } as IStockResponse;
                }
            }),
        )).filter(s => s.history.length);

        ctx.body = stockResponses;
    } catch (error) {
        console.error("Error when getting stocks: ", error);
        ctx.status = 500;
        ctx.body = error.message;
    }
});

router.post("/sim", async (ctx) => {
    try {
        const reqBody: SimParams = ctx.request.body as SimParams;

        const start = reqBody.start ?? "2000-01-01";
        const end = reqBody.end ?? DateTime.fromJSDate(new Date()).toSQLDate();
        const guildID = reqBody.guildID;

        const outPath = path.join(SIM_OUT_DIR, guildID);

        if (reqBody.clearCache) {
            rmSync(outPath, { recursive: true, force: true });
        }

        if (!existsSync(outPath)) {
            console.log("Exporting...");
            const cmd = `discordchatexporter-cli exportguild -g ${guildID} -f Json -o ${outPath}/ --after "${start}" --before "${end}" --parallel 8`;
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

        ctx.status = 200;
        console.log("Complete...");
    } catch (error) {
        console.error("Error during simulation:", error);
        ctx.status = 500;
        ctx.body = error.message;
    }
});

api.use(router.routes()).use(router.allowedMethods());
