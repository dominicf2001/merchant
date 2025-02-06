import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import { StocksFactory, UsersFactory, db } from "../database/db-objects";
import { promisify } from "util";
import { exec } from "child_process";
import { existsSync, rmSync } from "fs";
import { readdir, readFile, writeFile } from "fs/promises";
import { DateTime } from "luxon";
import { StatusCodes } from "http-status-codes";
import {
    MENTIONED_ACTIVITY_VALUE,
    MESSAGE_ACTIVITY_VALUE,
    SMA_UPDATE_HOURS,
    TOKEN,
    USER_TOKEN,
    client,
    getRandomInt,
    marketIsOpen,
} from "../utilities";
import { updateSMAS, updateStockPrices } from "../stock-utilities";
import { isStockInterval } from "../database/datastores/Stocks";
import path from "path";
import { dbWipe } from "../database/datastores/DataStore";

const execAsync = promisify(exec);

// TODO: centralize types
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

const SIM_DATA_PATH = "./built/api/sim-data.json";
const SIM_OUT_PATH = "./built/api/cache/";

export const api = new Koa();
const router = new Router();

api.use(bodyParser());

async function getSimData(): Promise<SimParams | undefined> {
    if (existsSync(SIM_DATA_PATH)) {
        return JSON.parse(await readFile(SIM_DATA_PATH, "utf8"));
    }
}

// gets available guilds
let guilds: Guild[] = [];
router.get("/guilds", async (ctx) => {
    if (!guilds.length) {
        const { stdout } = await execAsync(
            `discordchatexporter-cli guilds -t ${USER_TOKEN}`,
        );
        const guildStrs = stdout.split("\n").slice(1, -1);

        for (const guildStr of guildStrs) {
            const splitStr = guildStr.split("|");
            guilds.push({
                id: splitStr[0].trim(),
                name: splitStr[1].trim(),
            });
        }
    }

    ctx.body = guilds;
});

// gets stocks starting a startDate within specified range
router.get("/stock/:guildID/:range/:endDate/:startDate?", async (ctx) => {
    console.log("TEEST");
    try {
        const guildID = ctx.params.guildID
        if (!guildID) {
            ctx.throw("Missing guild ID", StatusCodes.BAD_REQUEST);
            return;
        }

        const Users = UsersFactory.get(guildID);
        const Stocks = StocksFactory.get(guildID);

        if (!ctx.params.endDate) {
            ctx.throw("Missing end date", StatusCodes.BAD_REQUEST);
            return;
        }

        if (!isStockInterval(ctx.params.range)) {
            ctx.throw("Invalid or missing range", StatusCodes.BAD_REQUEST);
            return;
        }

        const endDate = DateTime.fromISO(ctx.params.endDate);
        const startDate: DateTime | null = ctx.params.startDate
            ? DateTime.fromISO(ctx.params.startDate)
            : null;

        if (!endDate.isValid || !startDate.isValid) {
            ctx.throw(`Malformed start or end date`, StatusCodes.BAD_REQUEST);
            return;
        }

        const range = ctx.params.range;

        interface IStockEntry {
            value: number;
            time: number;
        }

        interface IStockResponse {
            name: string;
            history: IStockEntry[];
        }

        let users = await Users.getAll();

        const stockResponses = (
            await Promise.all(
                users.map(async (user) => {
                    try {
                        const userId = user.user_id;
                        // TODO: this is a bottleneck, need to find solution
                        //const username = (await client.users.fetch(userId))
                        //    .username;

                        const history = (
                            await Stocks.getStockHistory(userId, range, {
                                end: endDate,
                                start: startDate,
                            })
                        ).map((entry) => {
                            return {
                                value: entry.price,
                                time: new Date(entry.created_date).getTime(),
                            } as IStockEntry;
                        });

                        return {
                            name: userId,
                            history: history,
                        } as IStockResponse;
                    } catch (error) {
                        return {
                            name: "",
                            history: [],
                        } as IStockResponse;
                    }
                }),
            )
        ).filter((s) => s.history.length);

        ctx.body = stockResponses;
    } catch (error) {
        console.error("Error when getting stocks: ", error);
        ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;
        ctx.body = error.message;
    }
});

// gets last simulation in
router.get("/sim", async (ctx) => {
    try {
        const simData = await getSimData();
        if (!simData) {
            ctx.status = StatusCodes.NO_CONTENT;
            return;
        }

        ctx.body = simData;
    } catch (error) {
        console.error("Error when getting sim: ", error);
        ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;
        ctx.body = error.message;
    }
});

// runs a simulation
router.post("/sim", async (ctx) => {
    try {
        console.log("Clearing database...");
        await dbWipe(db);

        const reqBody: SimParams = ctx.request.body as SimParams;
        const start = reqBody.start ?? "2000-01-01T00:00";
        const end = reqBody.end ?? DateTime.fromJSDate(new Date()).toSQLDate();
        const guildID = reqBody.guildID;

        const Users = UsersFactory.get(guildID);
        const Stocks = StocksFactory.get(guildID);

        const outPath = path.join(SIM_OUT_PATH, guildID);

        const simData = await getSimData();

        const simParamsChanged =
            !simData ||
            start < simData.start ||
            end > simData.end ||
            simData.guildID != guildID;

        if (reqBody.clearCache || simParamsChanged) {
            rmSync(outPath, { recursive: true, force: true });
        }

        if (!existsSync(outPath)) {
            console.log("Exporting...");
            const cmd = `discordchatexporter-cli exportguild -g ${guildID} -f Json -o ${outPath}/ --after "${start}" --before "${end}" --parallel 8 -t ${USER_TOKEN}`;
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
            }),
        );

        const messages = channels
            .flatMap((channel) => channel.messages as Message[])
            .sort(
                (a, b) =>
                    DateTime.fromISO(a.timestamp).toMillis() -
                    DateTime.fromISO(b.timestamp).toMillis(),
            );

        console.log("Simulating...");
        const minuteIncrement = 5;
        const startDate = DateTime.fromISO(start);
        const endDate = DateTime.fromISO(end);

        if (!endDate.isValid || !startDate.isValid) {
            ctx.throw(`Malformed start or end date`, StatusCodes.BAD_REQUEST);
            return;
        }

        let nextTickDate = startDate.plus({ minutes: minuteIncrement });
        let msgIndex = 0;
        while (nextTickDate < endDate) {
            while (
                messages[msgIndex] &&
                DateTime.fromISO(messages[msgIndex].timestamp) < nextTickDate
            ) {
                const currMsg = messages[msgIndex];

                if (marketIsOpen(nextTickDate)) {
                    const authorId = currMsg.author.id;
                    const user = await Users.get(authorId);
                    if (!user) {
                        await Users.set(authorId);
                        await Stocks.updateStockPrice(authorId, 1, startDate);
                    }

                    for (const mentionedUser of currMsg.mentions) {
                        if (
                            mentionedUser.id !== authorId &&
                            !mentionedUser.isBot
                        ) {
                            await Users.addActivity(
                                mentionedUser.id,
                                MENTIONED_ACTIVITY_VALUE * getRandomInt(1, 2),
                                startDate,
                            );
                        }
                    }

                    await Users.addActivity(
                        authorId,
                        MESSAGE_ACTIVITY_VALUE * getRandomInt(1, 2),
                        startDate,
                    );
                }

                ++msgIndex;
            }

            if (marketIsOpen(nextTickDate)) {
                if (SMA_UPDATE_HOURS.includes(nextTickDate.hour)) {
                    await updateSMAS(guildID, nextTickDate);
                }

                await updateStockPrices(guildID, nextTickDate);
            }
            nextTickDate = nextTickDate.plus({ minutes: minuteIncrement });
        }

        // store simulation param data
        await writeFile(SIM_DATA_PATH, JSON.stringify(reqBody));

        ctx.status = StatusCodes.OK;
        console.log("Complete...");
    } catch (error) {
        console.error("Error during simulation:", error);
        ctx.status = StatusCodes.INTERNAL_SERVER_ERROR;
        ctx.body = error.message;
    }
});

api.use(router.routes()).use(router.allowedMethods());

client.login(TOKEN);

api.listen(3000, "0.0.0.0", () => {
    console.log("API listening on port 3000");
});
