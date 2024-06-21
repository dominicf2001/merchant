import Koa from "koa";
import Router from "koa-router";
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

api.use(router.routes()).use(router.allowedMethods()).use(bodyParser());

router.get("/stock/:range", async (ctx) => {
    // const date = DateTime.fromISO(ctx.params.date) ?? DateTime.now();
    const date = DateTime.now();
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
});

router.post("/sim/guild/:id", async (ctx) => {
    // ---------------------
    // fetch all guild messages
    // ---------------------
    console.log("Reading...");

    const guildId = ctx.params.id;
    const outPath = `${SIM_OUT_DIR}/${guildId}/`;
    const isCached = existsSync(outPath);

    if (!isCached) {
        console.log("Exporting...");
        const cmd = `discordchatexporter-cli exportguild -g ${guildId} -f Json -o ${outPath} --after 06/10/2024 --parallel 8`;
        const { stdout } = await execAsync(cmd);
        console.log(stdout);
    }

    const channelFileNames = await readdir(outPath);
    const promises = channelFileNames.map((channelFileName) =>
        readFile(`${outPath}/${channelFileName}`, "utf8").then(JSON.parse),
    );

    // TODO: can be optimized by doing each channel in parallel
    const channels = await Promise.all(promises);
    const messages: Message[] = channels
        .flatMap((channel) => channel.messages as Message[])
        .sort((a, b) =>
            DateTime.fromISO(a.timestamp)
                .diff(DateTime.fromISO(b.timestamp))
                .toMillis(),
        );

    // ---------------------

    // ---------------------
    // run simulation on messages
    // ---------------------
    console.log("Simulating...");

    const minuteIncrement = 5;

    let currDate = DateTime.fromISO(messages[0].timestamp);
    const endDate = DateTime.fromISO(messages[messages.length - 1].timestamp);
    let nextTickDate = currDate.plus({ minute: minuteIncrement });

    let i = 0;
    while (currDate < endDate) {
        const currMessage = messages[i++];
        currDate = DateTime.fromISO(currMessage.timestamp);

        if (currDate >= nextTickDate) {
            await updateStockPrices();
            nextTickDate = nextTickDate.plus({ minute: minuteIncrement });
        }

        const authorId = currMessage.author.id;

        const user = await Users.get(authorId);
        if (user) {
            await Users.set(authorId);
            await Stocks.updateStockPrice(authorId, 1);
        }

        const mentionedUsers = currMessage.mentions;
        mentionedUsers.forEach(async (user) => {
            if (user.id != authorId && !user.isBot) {
                await Users.addActivity(
                    user.id,
                    MENTIONED_ACTIVITY_VALUE * getRandomInt(2, 4),
                );
            }
        });

        await Users.addActivity(
            authorId,
            MESSAGE_ACTIVITY_VALUE * getRandomInt(2, 4),
        );
    }
    console.log("Complete...");
    // ---------------------
});
