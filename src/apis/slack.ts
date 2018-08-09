export interface IEventMessage {
    type: string;
    token: string;
}

export interface IEventChallengeMessage extends IEventMessage {
    challenge: string;
}

export function isEventChallengeMessage(json: Object): json is IEventChallengeMessage {
    return (json as IEventChallengeMessage).type === "url_verification";
}

export interface IEventPayload extends IEventMessage {
    team_id: string;
    api_app_id: string;
}

export interface IEventRateLimit extends IEventPayload {
    minute_rate_limited: number;
}

export function isEventRateLimitRequest(json: Object): json is IEventRateLimit {
    return (json as IEventRateLimit).type === "app_rate_limited";
}

export interface IEventWrapper extends IEventPayload {
    authed_users: string[];
    event_id: string;
    event_time: number;
    event: IEvent;
}

export interface IEvent {
    type: string;
    event_ts: string;
}

export interface IMessageEvent extends IEvent {
    type: "message";
    channel_type: "app_home" | "im" | "channel" | "group" | "mpim";
    channel: string;
    user: string;
    text: string;
    ts: string;
}
