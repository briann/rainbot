import ISecretStore from "./secrets/secretStore";
import { IRouterContext } from "koa-router";
import { stringify } from "querystring";

const SLACK_OAUTH_BASE_URL = "https://slack.com/oauth/authorize?";

export default class IndexHandler {
    constructor(private secretStore: ISecretStore) {}

    public handler = async (context: IRouterContext) => {
        const redirectUri = await this.secretStore.getSecret("SlackRedirectUri");
        const slackClientIdentifier = await this.secretStore.getSecret("SlackClientIdentifier");
        const scopes = [
            "chat:write"
        ].join(",");
        const oauthUrl = SLACK_OAUTH_BASE_URL + stringify({
            redirect_uri: redirectUri,
            client_id: slackClientIdentifier,
            scope: scopes
        });
        await context.render("index", {
            oauthUrl
        });
    }
}