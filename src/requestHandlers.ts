import { IRouterContext } from "koa-router";
import fetch from "node-fetch";

import { ForecastResponse } from "./apis/darkSky";
import { GeocodeResponse } from "./apis/gmapsApi";
import ISecretStore from "./secrets/secretStore";

function getForecastUrl(apiKey: string, lat: number, lng: number) {
    return `https://api.darksky.net/forecast/${apiKey}/${lat},${lng}`;
}

function getGeocodeUrl(apiKey: string, searchString: string) {
    return `https://maps.googleapis.com/maps/api/geocode/json?address=${searchString}&key=${apiKey}`;
}

export default class RequestHandlers {

    constructor(private secretStore: ISecretStore) {}

    public searchStringGetHandler = async (context: IRouterContext) => {
        const gmapsApiKey = await this.secretStore.getSecret("GmapsApiKey");
        const darkSkyApiKey = await this.secretStore.getSecret("DarkSkyApiKey");
        const searchString = "San Francisco";
        const geocodeUrl = getGeocodeUrl(gmapsApiKey, searchString);
        const geocodeFetchResult = await fetch(geocodeUrl);
        const geocodeResponse: GeocodeResponse = await geocodeFetchResult.json();
        const geocodeResult = geocodeResponse.results[0];
        const geocodeLocation = geocodeResult.geometry.location;
        const forecastUrl = getForecastUrl(darkSkyApiKey, geocodeLocation.lat, geocodeLocation.lng);
        const forecastFetchResult = await fetch(forecastUrl);
        const forecastResponse: ForecastResponse = await forecastFetchResult.json();
        context.type = "application/json";
        context.body = forecastResponse;
    }
}