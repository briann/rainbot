import {
    IEvent,
    IEventMetadata,
    IMessageEvent,
    isMessageFromBot
} from "./apis/slack";
import { EventEmitter } from "events";
import { WebClient } from "@slack/client";
import { IWeatherService } from "./weatherService";

abstract class SlackEventListener {
    constructor(public eventName: string) {}
    abstract listener(event: IEvent, metadata?: IEventMetadata): void;
}

class MessageAppHomeListener extends SlackEventListener {
    constructor(private slackClient: WebClient, private weatherService: IWeatherService) {
        super("message.app_home");
    }

    public listener = async (event: IMessageEvent) => {
        if (isMessageFromBot(event)) {
            return;
        }
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
                    text: message
                });
            } else {
                throw new Error("Did not have all components to render weather message.");
            }
        } catch (exception) {
            await this.slackClient.chat.postMessage({
                channel: event.channel,
                text: `Could not get forecast for *${event.text}*.`
            });
            // Do something better here.
            console.log(exception);
        }
    }
}

export function registerListeners(eventEmitter: EventEmitter, slackClient: WebClient,
        weatherService: IWeatherService) {
    const listeners: SlackEventListener[] = [
        new MessageAppHomeListener(slackClient, weatherService)
    ];
    for (let listener of listeners) {
        eventEmitter.on(listener.eventName, listener.listener);
    }
}
