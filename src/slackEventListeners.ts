import {
    IEvent,
    IEventMetadata,
    IMessageEvent,
    isMessageFromBot
} from "./apis/slack";
import { EventEmitter } from "events";
import { WebClient } from "@slack/client";
import { IWeatherService } from "./weatherService";
import * as GCPDatastore from "@google-cloud/datastore";
import { DATASTORE_XOXA_KIND, IAuthedXoxaToken } from "./datastoreEventListeners";

abstract class SlackEventListener {
    constructor(public eventName: string) {}
    abstract listener(event: IEvent, metadata?: IEventMetadata): void;
}

class MessageAppHomeListener extends SlackEventListener {
    constructor(private slackClient: WebClient,
                private weatherService: IWeatherService,
                private datastore: GCPDatastore) {
        super("message.app_home");
    }

    public listener = async (event: IMessageEvent, metadata: IEventMetadata) => {
        if (isMessageFromBot(event)) {
            return;
        }

        // Move to function.
        const teamId = metadata.teamId;
        const key = this.datastore.key([DATASTORE_XOXA_KIND, teamId]);
        const tokenFetch = await this.datastore.get(key);
        const tokenResult = tokenFetch[0];
        if (tokenResult === undefined) {
            throw new Error("No secret found.");
        }
        const token = (tokenResult as IAuthedXoxaToken).token;

        try {
            const result = await this.weatherService.getWeatherForSearchString(event.text);
            const forecast = result.forecast;
            const geocode = result.geocode;
            const currently = forecast.currently;
            if (currently
                    && currently.summary
                    && currently.temperature
                    && forecast.hourly
                    && forecast.hourly.summary) {
                const location = geocode.results[0].formatted_address;
                const temp = Math.floor(currently.temperature);
                const message = `Currently in *${location}*\n`
                        + `> *${currently.summary}* with a temperature of *${temp}°F*.\n`
                        + `> ${forecast.hourly.summary}`;
                await this.slackClient.chat.postMessage({
                    channel: event.channel,
                    text: message,
                    token
                });
            } else {
                throw new Error("Did not have all components to render weather message.");
            }
        } catch (exception) {
            await this.slackClient.chat.postMessage({
                channel: event.channel,
                text: `Could not get forecast for *${event.text}*.`,
                token
            });
            // Do something better here.
            console.log(exception);
        }
    }
}

export function registerListeners(eventEmitter: EventEmitter, slackClient: WebClient,
        weatherService: IWeatherService, datastore: GCPDatastore) {
    const listeners: SlackEventListener[] = [
        new MessageAppHomeListener(slackClient, weatherService, datastore)
    ];
    for (let listener of listeners) {
        eventEmitter.on(listener.eventName, listener.listener);
    }
}
