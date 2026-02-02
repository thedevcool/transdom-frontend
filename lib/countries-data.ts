import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';
import { getZoneForCountry } from './zone-mapping';

export interface CountryOption {
  value: string;
  label: string;
  isoCode: string;
  zone: string | null;
}

export interface StateOption {
  value: string;
  label: string;
  isoCode: string;
  countryCode: string;
}

export interface CityOption {
  value: string;
  label: string;
}

/**
 * Get all countries with zone mapping
 */
export function getAllCountries(): CountryOption[] {
  const countries = Country.getAllCountries();
  
  return countries.map((country: ICountry) => ({
    value: country.name,
    label: country.name,
    isoCode: country.isoCode,
    zone: getZoneForCountry(country.name),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get states for a specific country
 */
export function getStatesOfCountry(countryIsoCode: string): StateOption[] {
  const states = State.getStatesOfCountry(countryIsoCode);
  
  if (!states || states.length === 0) {
    return [];
  }
  
  return states.map((state: IState) => ({
    value: state.name,
    label: state.name,
    isoCode: state.isoCode,
    countryCode: state.countryCode,
  })).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get cities for a specific state
 */
export function getCitiesOfState(countryIsoCode: string, stateIsoCode: string): CityOption[] {
  const cities = City.getCitiesOfState(countryIsoCode, stateIsoCode);
  
  if (!cities || cities.length === 0) {
    return [];
  }
  
  return cities.map((city: ICity) => ({
    value: city.name,
    label: city.name,
  })).sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get country by name
 */
export function getCountryByName(countryName: string): ICountry | undefined {
  const countries = Country.getAllCountries();
  return countries.find((country: ICountry) => 
    country.name.toLowerCase() === countryName.toLowerCase()
  );
}

/**
 * Get country ISO code by name
 */
export function getCountryIsoCode(countryName: string): string | null {
  const country = getCountryByName(countryName);
  return country ? country.isoCode : null;
}

/**
 * Get state by name for a country
 */
export function getStateByName(countryIsoCode: string, stateName: string): IState | undefined {
  const states = State.getStatesOfCountry(countryIsoCode);
  return states.find((state: IState) => 
    state.name.toLowerCase() === stateName.toLowerCase()
  );
}

/**
 * Get state ISO code
 */
export function getStateIsoCode(countryIsoCode: string, stateName: string): string | null {
  const state = getStateByName(countryIsoCode, stateName);
  return state ? state.isoCode : null;
}
