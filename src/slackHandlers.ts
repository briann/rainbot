import { createHmac } from "crypto";
import { IRouterContext } from "koa-router";
import ISecretStore from "./secrets/secretStore";
import { isEventChallengeMessage, IEventChallengeMessage } from "./apis/slack";

const REPLAY_ATTACK_THRESHOLD_MS = 5 * 60 * 1000;

export default class SlackHandlers {
    constructor(private secretStore: ISecretStore) {}

    public eventApiPostHandler = async (context: IRouterContext) => {
        const isValidRequest = await this.isValidRequestFromSlack(context);
        if (!isValidRequest) {
            throw new Error("Invalid request, signature failed.");
        }

        // TODO: Check for X-Slack-Retry-* and handle appropriately.

        const requestBody = context.request.body;
        if (isEventChallengeMessage(requestBody)) {
            this.handleEventsChallengePost(context, requestBody);
        } else {
            console.log(context.request.body);
            throw new Error("Unknown Slack Event POST!");
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