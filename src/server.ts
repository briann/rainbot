import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import * as views from "koa-views";
import * as path from "path";
import * as Datastore from "@google-cloud/datastore";
import * as logger from "koa-logger";
import { DatastoreSecretStore } from "./secrets/datastoreSecretStore";
import SlackHandlers from "./slackHandlers";
import { EventEmitter } from "events";
import { registerListeners } from "./slackEventListeners";
import { WebClient } from "@slack/client";
import { GmapsDarkSkyWeatherService } from "./weatherService";

async function main() {
    const datastoreClient = new Datastore({});
    const secretStore = new DatastoreSecretStore(datastoreClient);

    // Init & config server.
    const app = new Koa();
    app.use(logger());
    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            ctx.status = err.status || 500;
            ctx.app.emit('error', err);
        }
    });
    app.on('error', (err) => { console.log(err); });
    app.use(bodyParser());
    app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }));

    // One Slack Web API client for the entire app.
    const slackToken = await secretStore.getSecret("SlackTestTeamToken");
    const slackClient = new WebClient(slackToken);

    const weatherService = new GmapsDarkSkyWeatherService(secretStore);

    // Set up Slack event processing.
    const eventEmitter = new EventEmitter();
    registerListeners(eventEmitter, slackClient, weatherService);

    // Set up routes.
    const router = new Router();
    const slackHandlers = new SlackHandlers(secretStore, eventEmitter);
    router.get("/", async (ctx) => {
        await ctx.render("index");
    });
    router.post("/slack-events", slackHandlers.eventApiPostHandler);
    app.use(router.routes());

    // Start listening.
    const PORT = process.env.PORT || 3000;
    app.listen(PORT);
    console.log(`Server running on port ${PORT}`);
}

main();
