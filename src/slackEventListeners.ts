import {
    IEvent,
    IEventMetadata,
    IMessageEvent,
    isMessageFromApp
} from "./apis/slack";
import { EventEmitter } from "events";
import { WebClient } from "@slack/client";

abstract class SlackEventListener {
    constructor(public eventName: string) {}
    abstract listener(event: IEvent, metadata?: IEventMetadata): void;
}

class MessageAppHomeListener extends SlackEventListener {
    constructor(private slackClient: WebClient) {
        super("message.app_home");
    }

    public listener = async (event: IMessageEvent) => {
        console.log(event);
        if (isMessageFromApp(event)) {
            return;
        }
        try {
            const result = await this.slackClient.chat.postMessage({
                channel: event.channel,
                text: event.text
            });
            console.log(result);
        } catch (exception) {
            console.log(exception);
        }

    }
}

export function registerListeners(eventEmitter: EventEmitter, slackClient: WebClient) {
    const listeners: SlackEventListener[] = [
        new MessageAppHomeListener(slackClient)
    ];
    for (let listener of listeners) {
        eventEmitter.on(listener.eventName, listener.listener);
    }
}
