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

export interface IRootEvent extends IEventMessage {
    team_id: string;
    api_app_id: string;
}

export interface IEventRateLimit extends IRootEvent {
    minute_rate_limited: number;
}

export function isEventRateLimitRequest(json: Object): json is IEventRateLimit {
    return (json as IEventRateLimit).type === "app_rate_limited";
}

export interface IEventWrapper extends IRootEvent {
    event_id: string;
    event_time: number;
    event: IEvent;
}

export interface IEvent {}
