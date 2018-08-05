export interface IEventsChallengeRequest {
    token: string;
    challenge: string;
    type: string;
}

export function isEventsChallengeRequest(json: Object): json is IEventsChallengeRequest {
    return (json as IEventsChallengeRequest).challenge !== undefined;
}
