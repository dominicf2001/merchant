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
import { SimParams, Guild, Message, SimState } from "./types";

const execAsync = promisify(exec);

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

let currentSim: SimState | undefined;

// gets available guilds
let guilds: Guild[] = [];
router.get("/guilds", async (ctx) => {
    console.log("IN GUILDs");
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
    try {
        const guildID = ctx.params.guildID;
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

// gets last simulation params 
router.get("/sim/progress", async (ctx) => {
    ctx.body = currentSim ?
        currentSim.progress :
        -1;
});

// gets last simulation 
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
    const MINUTE_INCREMENT = 5;

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

        currentSim = {
            start: DateTime.fromISO(start),
            end: DateTime.fromISO(end),
            nextTick: DateTime.fromISO(start).plus({ minutes: MINUTE_INCREMENT }),
            progress: 0,
        }

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

        if (!currentSim.start.isValid || !currentSim.end.isValid) {
            return ctx.throw(`Malformed start or end date`, StatusCodes.BAD_REQUEST);
        }

        let msgIndex = 0;
        const durationToTraverse = currentSim.start.diff(currentSim.end);
        while (currentSim.nextTick < currentSim.end) {
            const durationTraversed = currentSim.start.diff(currentSim.nextTick);

            currentSim.progress = Math.round((durationTraversed.toMillis() / durationToTraverse.toMillis() * 100));
            Bun.stdout.write(`\r${currentSim.progress}/100   `);

            while (
                messages[msgIndex] &&
                DateTime.fromISO(messages[msgIndex].timestamp) < currentSim.nextTick
            ) {
                const currMsg = messages[msgIndex];

                if (marketIsOpen(currentSim.nextTick)) {
                    const authorId = currMsg.author.id;
                    const user = await Users.get(authorId);
                    if (!user) {
                        var userSetSuccess = await Users.set(authorId);
                        if (!userSetSuccess) {
                            ++msgIndex;
                            continue;
                        }

                        await Stocks.updateStockPrice(authorId, 1, currentSim.start);
                    }

                    for (const mentionedUser of currMsg.mentions) {
                        const mentionedUserExists = !!(await Users.get(
                            mentionedUser.id,
                        ));
                        if (
                            mentionedUserExists &&
                            mentionedUser.id !== authorId &&
                            !mentionedUser.isBot
                        ) {
                            await Users.addActivity(
                                mentionedUser.id,
                                MENTIONED_ACTIVITY_VALUE * getRandomInt(1, 2),
                                currentSim.start,
                            );
                        }
                    }

                    await Users.addActivity(
                        authorId,
                        MESSAGE_ACTIVITY_VALUE * getRandomInt(1, 2),
                        currentSim.start,
                    );
                }

                ++msgIndex;
            }

            if (marketIsOpen(currentSim.nextTick)) {
                if (SMA_UPDATE_HOURS.includes(currentSim.nextTick.hour)) {
                    await updateSMAS(guildID, currentSim.nextTick);
                }

                await updateStockPrices(guildID, currentSim.nextTick);
            }
            currentSim.nextTick = currentSim.nextTick.plus({ minutes: MINUTE_INCREMENT });
        }

        // store simulation param data
        await writeFile(SIM_DATA_PATH, JSON.stringify(reqBody));

        currentSim = undefined;

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
