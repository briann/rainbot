import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import * as views from "koa-views";
import * as path from "path";
import * as GCPDatastore from "@google-cloud/datastore";
import * as logger from "koa-logger";
import { GCPDatastoreSecretStore } from "./secrets/gcpDatastoreSecretStore";
import SlackHandlers from "./slackHandlers";
import { EventEmitter } from "events";
import { registerListeners } from "./slackEventListeners";
import { WebClient } from "@slack/client";
import { GmapsDarkSkyWeatherService } from "./weatherService";

async function main() {
    const ENV = process.env.NODE_ENV || "development";
    console.log(`Starting server in ${ENV} mode...`);
    const gcpDatastore = new GCPDatastore({
        namespace: process.env.GCP_DATASTORE_NAMESPACE || ENV
    });
    const secretStore = new GCPDatastoreSecretStore(gcpDatastore);
    const slackToken = await secretStore.getSecret("SlackTestTeamToken");
    const slackClient = new WebClient(slackToken);
    const weatherService = new GmapsDarkSkyWeatherService(secretStore);

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
    console.log(`Server running on port ${PORT}.`);
}

main();
