import { createHmac } from "crypto";
import { IRouterContext } from "koa-router";
import ISecretStore from "./secrets/secretStore";
import {
    IEventChallengeMessage,
    IEventWrapper,
    isEventChallengeMessage,
    isEventRateLimitRequest,
    isEventWrapper,
    isMessageEvent,
    IEventMetadata,
    isAuthSuccessResponse
} from "./apis/slack";
import SlackError from "./slackError";
import { EventEmitter } from "events";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

const REPLAY_ATTACK_THRESHOLD_MS = 5 * 60 * 1000;
const SLACK_OAUTH_ACCESS_URL = "https://slack.com/api/oauth.access";

export default class SlackHandlers {
    constructor(private secretStore: ISecretStore, private eventEmitter: EventEmitter) {}

    public authHandler = async (context: IRouterContext) => {
        const redirectUri = await this.secretStore.getSecret("SlackRedirectUri");
        const slackClientIdentifier = await this.secretStore.getSecret("SlackClientIdentifier");
        const slackClientSecret = await this.secretStore.getSecret("SlackClientSecret");
        const code = context.request.query["code"];
        const params = new URLSearchParams();
        params.append("client_id", slackClientIdentifier);
        params.append("client_secret", slackClientSecret);
        params.append("code", code);
        params.append("redirect_uri", redirectUri);
        const authResponse = await fetch(SLACK_OAUTH_ACCESS_URL, {
            method: "POST",
            body: params
        });
        const authResult = await authResponse.json();
        if (isAuthSuccessResponse(authResult)) {
            const xoxaToken = authResult.access_token;
            setImmediate(() => {
                this.eventEmitter.emit("slack:authed-xoxa-token", {
                    teamId: authResult.team_id,
                    token: xoxaToken
                });
            });
        } else {
            console.log(authResult);
            throw new SlackError("Unable to complete OAuth");
        }
        context.response.status = 200;
    }

    public eventApiPostHandler = async (context: IRouterContext) => {
        const isValidRequest = await this.isValidRequestFromSlack(context);
        if (!isValidRequest) {
            throw new Error("Invalid request, signature failed.");
        }

        // TODO: Handle retries appropriately.
        if (context.request.header["x-slack-retry-num"]) {
            const retryCount = context.request.header["x-slack-retry-num"];
            const retryReason = context.request.header["x-slack-retry-reason"];
            console.log(`Received a retry request (retry #${retryCount} due to [${retryReason}])`);
            console.log(context.request.body);
            context.response.header["X-Slack-No-Retry"] = 1;
            throw new SlackError("Can't handle retries.");
        }

        const requestBody = context.request.body;
        if (isEventChallengeMessage(requestBody)) {
            this.handleEventsChallengePost(context, requestBody);
        } else if (isEventRateLimitRequest(requestBody)) {
            throw new SlackError("Can't handle rate limiting.");
        } else if (isEventWrapper(requestBody)) {
            setImmediate(() => {
                this.dispatchEvent(requestBody);
            });
        } else {
            console.log(context.request.body);
            throw new SlackError("Unknown Slack event request!");
        }
        context.response.status = 200;
    }

    private dispatchEvent(wrapper: IEventWrapper) {
        const event = wrapper.event;
        const metadata: IEventMetadata = {
            eventId: wrapper.event_id,
            eventTimeSec: wrapper.event_time,
            teamId: wrapper.team_id
        };
        if (isMessageEvent(event)) {
            const messageType = `${event.type}.${event.channel_type}`;
            this.eventEmitter.emit(messageType, event, metadata);
        } else {
            this.eventEmitter.emit(event.type, event, metadata);
        }
    }

    private handleEventsChallengePost(context: IRouterContext, requestBody: IEventChallengeMessage) {
        context.response.body = requestBody.challenge;
    }

    private async isValidRequestFromSlack(context: IRouterContext): Promise<boolean> {
        if (process.env.NODE_ENV == "development" && context.request.hostname == "localhost") {
            return true;
        }

        const timestampSec = context.header["x-slack-request-timestamp"];
        const timeDifferentialMs = Date.now() - (timestampSec * 1000);
        if (Math.abs(timeDifferentialMs) > REPLAY_ATTACK_THRESHOLD_MS) {
            throw new Error("Replay attack detected.");
        }

        const slackSigningSecret = await this.secretStore.getSecret("SlackSigningSecret");
        const baseString = `v0:${timestampSec}:${context.request.rawBody}`;
        const digest = createHmac("sha256", slackSigningSecret).update(baseString).digest("hex");
        const computedSignature = `v0=${digest}`;
        const providedSignature = context.header["x-slack-signature"];
        return computedSignature == providedSignature;
    }
}