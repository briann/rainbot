export interface GeocodeResponse {
    results: GeocodeResult[];
    status: string;
}

export interface GeocodeResult {
    address_components: any[];
    formatted_address: string;
    geometry: GeocodeGeometry;
    place_id: string;
    types: string[];
}

export interface GeocodeGeometry {
    location: LatLng;
}

export interface LatLng {
    lat: number;
    lng: number;
}