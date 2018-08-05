import * as Koa from "koa";
import * as Router from "koa-router";
import * as bodyParser from "koa-bodyparser";
import * as views from "koa-views";
import * as path from "path";
import * as Datastore from "@google-cloud/datastore";
import RequestHandlers from "./requestHandlers";
import { DatastoreSecretStore } from "./secrets/datastoreSecretStore";

const datastoreClient = new Datastore({});
const datastoreSecretStore = new DatastoreSecretStore(datastoreClient);

// Init & config server.
const app = new Koa();
app.use(bodyParser());
app.use(views(path.join(__dirname, '/views'), { extension: 'ejs' }));

// Set up routes.
const router = new Router();
const requestHandlers = new RequestHandlers(datastoreSecretStore);
router.get("/", async (ctx) => {
    await ctx.render("index");
});
router.get("/weather", requestHandlers.searchStringGetHandler);
app.use(router.routes());

// Start listening.
const PORT = process.env.PORT || 3000;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);
