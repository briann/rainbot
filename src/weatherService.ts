import fetch from "node-fetch";
import { ForecastResponse } from "./apis/darkSky";
import { GeocodeResponse } from "./apis/gmapsApi";
import ISecretStore from "./secrets/secretStore";

function getForecastUrl(apiKey: string, lat: number, lng: number) {
    return `https://api.darksky.net/forecast/${apiKey}/${lat},${lng}`;
}

function getGeocodeUrl(apiKey: string, address: string) {
    return `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${apiKey}`;
}

export interface WeatherSearchResult {
    forecast: ForecastResponse;
    geocode: GeocodeResponse;
}

export interface IWeatherService {
    getWeatherForSearchString(searchString: string): Promise<WeatherSearchResult>;
}

export class GmapsDarkSkyWeatherService implements IWeatherService {
    constructor(private secretStore: ISecretStore) {}

    public getWeatherForSearchString = async (searchString: string) => {
        const gmapsApiKey = await this.secretStore.getSecret("GmapsApiKey");
        const darkSkyApiKey = await this.secretStore.getSecret("DarkSkyApiKey");
        const geocodeFetchResult = await fetch(getGeocodeUrl(gmapsApiKey, searchString));
        const geocodeResponse: GeocodeResponse = await geocodeFetchResult.json();
        const geocodeLocation = geocodeResponse.results[0].geometry.location;
        const forecastFetchResult = await fetch(
            getForecastUrl(darkSkyApiKey, geocodeLocation.lat, geocodeLocation.lng));
        const forecastResponse: ForecastResponse = await forecastFetchResult.json();
        return {
            forecast: forecastResponse,
            geocode: geocodeResponse
        };
    }
}