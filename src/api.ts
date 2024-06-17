import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";
import { Stocks } from "./database/db-objects";
import { promisify } from "util";
import { exec } from "child_process";
import { readFileSync, unlinkSync } from "fs";

const execAsync = promisify(exec);

const SIM_OUT_PATH = "./simout.json";

async function discordExportChannel(channelId: string) {
    const cmd = `discordchatexporter-cli export -c ${channelId} -f Json -o ${SIM_OUT_PATH}`;
    const { stdout } = await execAsync(cmd);
    console.log(stdout);

    const data = JSON.parse(readFileSync(SIM_OUT_PATH, "utf8"));
    unlinkSync(SIM_OUT_PATH);
    return data;
}

async function discordExportGuild(guildId: string) {
    const cmd = `discordchatexporter-cli exportguild -g ${guildId} -f Json -o ${SIM_OUT_PATH}`;
    const { stdout } = await execAsync(cmd);
    console.log(stdout);

    const data = JSON.parse(readFileSync(SIM_OUT_PATH, "utf8"));
    unlinkSync(SIM_OUT_PATH);
    return data;
}

export const api = new Koa();
const router = new Router();

api.use(router.routes()).use(router.allowedMethods()).use(bodyParser());

router.get("/stock", async (ctx) => {
    const stocks = await Stocks.getAll();

    ctx.body = stocks;
});

router.get("/sim/guild/:id", async (ctx) => {
    const guildId = ctx.params.id;
    const data = await discordExportGuild(guildId);

    ctx.body = data;
});

router.get("/sim/channel/:id", async (ctx) => {
    const channelId = ctx.params.id;
    const data = await discordExportChannel(channelId);

    ctx.body = data;
});
