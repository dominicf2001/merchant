import Koa from "koa";
import Router from "koa-router";
import bodyParser from "koa-bodyparser";

export const api = new Koa();
const router = new Router();

api.use(router.routes()).use(router.allowedMethods()).use(bodyParser());

router.get("/", (ctx) => {
    ctx.body = "Hello world!";
});
