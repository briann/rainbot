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

export function isEventWrapper(json: Object): json is IEventWrapper {
    const possibleEvent = json as IEventWrapper;
    // Not checking for authed_users because the docs are inconsistent about it (authed_teams?).
    return possibleEvent.event !== undefined
        && possibleEvent.event_id !== undefined
        && possibleEvent.event_time !== undefined;
}

// This is not from the Slack API - synthetic object we will create.
export interface IEventMetadata {
    teamId: string;
    eventId: string;
    eventTimeSec: number;
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
    // This property doesn't show up in any schemas or docs, but _is_ there,
    // at least in workspace apps messages posted via chat.postMessage.
    bot_id?: string;
}

export function isMessageEvent(json: Object): json is IMessageEvent {
    // Not actually checking valid channel_type here.
    return (json as IMessageEvent).type === "message";
}

export function isMessageFromBot(event: IMessageEvent): boolean{
    return event.bot_id !== undefined;
}
