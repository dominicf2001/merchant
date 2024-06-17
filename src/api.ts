import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import { Stocks } from "./database/db-objects";
import { promisify } from "util";
import { exec } from "child_process";
import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";

const execAsync = promisify(exec);

export interface Message {
    id: string;
    type: string;
    timestamp: Date;
    timestampEdited: null;
    callEndedTimestamp: null;
    isPinned: boolean;
    content: string;
    author: Author;
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

router.get("/stock", async (ctx) => {
    const stocks = await Stocks.getAll();

    ctx.body = stocks;
});

router.get("/sim/guild/:id", async (ctx) => {
    // fetch all guild messages
    // ---------------------
    const guildId = ctx.params.id;
    const outPath = `${SIM_OUT_DIR}/${guildId}/`;
    const isCached = existsSync(outPath);

    if (!isCached) {
        console.log("Exporting...");
        const cmd = `discordchatexporter-cli exportguild -g ${guildId} -f Json -o ${outPath} --after 06/10/2024 --parallel 8`;
        const { stdout } = await execAsync(cmd);
        console.log(stdout);
    } else {
        console.log("In cache.");
    }

    const channelFileNames = await readdir(outPath);
    const promises = channelFileNames.map((channelFileName) =>
        readFile(`${outPath}/${channelFileName}`, "utf8").then(JSON.parse),
    );

    const channels = await Promise.all(promises);
    const messages: Message[] = channels.flatMap((channel) => channel.messages);
    // ---------------------

    // ctx.body = data;
});
