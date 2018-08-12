export interface DataPoint {
    time: string;
    summary?: string;
    cloudCover?: number;
    dewPoint?: number;
    humidity?: number;
    icon?: string;
    ozone?: number;
    precipIntensity?: number;
    precipProbability?: number;
    precipType?: string;
    pressure?: number;
    uvIndex?: number;
    visibility?: number;
    windBearing?: number;
    windGust?: number;
    windSpeed?: number;
}

export interface MinutelyDataPoint extends DataPoint {}

export interface TemperatureDataPoint extends DataPoint {
    temperature?: number;
}

export interface HourlyDataPoint extends TemperatureDataPoint {
    precipAccumulation?: number;
}

export interface DailyDataPoint extends TemperatureDataPoint {
    apparentTemperature?: number;
    apparentTemperatureHigh?: number;
    apparentTemperatureHighTime?: number;
    apparentTemperatureLow?: number;
    apparentTemperatureLowTime?: number;
    moonPhase?: number;
    precipAccumulation?: number;
    precipIntensityMax?: number;
    precipIntensityMaxTime?: number;
    sunriseTime?: number;
    sunsetTime?: number;
    temperatureHigh?: number;
    temperatureHighTime?: number;
    temperatureLow?: number;
    temperatureLowTime?: number;
    uvIndexTime?: number;
}

export interface CurrentDataPoint extends TemperatureDataPoint {
    nearestStormBearing?: number;
    nearestStormDistance?: number;
}

export interface DataBlock<T extends DataPoint> {
    data: T[];
    summary?: string;
    icon?: string;
}

export interface Alert {
    description: string;
    expires: number;
    regions: string[];
    severity: string;
    time: number;
    title: string;
    uri: string;
}

export interface ForecastResponse {
    latitude: string;
    longitude: string;
    timezone: string;
    currently?: CurrentDataPoint;
    minutely?: DataBlock<MinutelyDataPoint>;
    hourly?: DataBlock<HourlyDataPoint>;
    daily?: DataBlock<DailyDataPoint>;
    alerts?: Alert[];
}
