/**
 * Country to Zone Mapping for Transdom Express Rates
 * Maps full country names to their corresponding shipping zones
 */

export const COUNTRY_TO_ZONE: Record<string, string> = {
  // UK_IRELAND Zone
  "United Kingdom": "UK_IRELAND",
  England: "UK_IRELAND",
  Scotland: "UK_IRELAND",
  Wales: "UK_IRELAND",
  "Northern Ireland": "UK_IRELAND",
  Ireland: "UK_IRELAND",
  "Republic of Ireland": "UK_IRELAND",

  // AFRICA Zone
  Nigeria: "AFRICA",
  Ghana: "AFRICA",
  Senegal: "AFRICA",
  "Ivory Coast": "AFRICA",
  "Cote d'Ivoire": "AFRICA",
  Cameroon: "AFRICA",
  Benin: "AFRICA",
  Togo: "AFRICA",
  Mali: "AFRICA",
  "Burkina Faso": "AFRICA",
  Niger: "AFRICA",
  Chad: "AFRICA",
  "Central African Republic": "AFRICA",
  Congo: "AFRICA",
  "Democratic Republic of Congo": "AFRICA",
  Gabon: "AFRICA",
  "Equatorial Guinea": "AFRICA",
  "Sierra Leone": "AFRICA",
  Liberia: "AFRICA",
  Guinea: "AFRICA",
  "Guinea-Bissau": "AFRICA",
  Gambia: "AFRICA",

  // USA_CANADA Zone
  "United States": "USA_CANADA",
  USA: "USA_CANADA",
  "United States of America": "USA_CANADA",
  Canada: "USA_CANADA",

  // EUROPE Zone
  France: "EUROPE",
  Germany: "EUROPE",
  Spain: "EUROPE",
  Italy: "EUROPE",
  Netherlands: "EUROPE",
  Belgium: "EUROPE",
  Switzerland: "EUROPE",
  Austria: "EUROPE",
  Portugal: "EUROPE",
  Greece: "EUROPE",
  Poland: "EUROPE",
  Sweden: "EUROPE",
  Norway: "EUROPE",
  Denmark: "EUROPE",
  Finland: "EUROPE",
  "Czech Republic": "EUROPE",
  Hungary: "EUROPE",
  Romania: "EUROPE",
  Slovakia: "EUROPE",
  Bulgaria: "EUROPE",
  Croatia: "EUROPE",
  Slovenia: "EUROPE",
  Luxembourg: "EUROPE",
  Malta: "EUROPE",
  Cyprus: "EUROPE",
  Estonia: "EUROPE",
  Latvia: "EUROPE",
  Lithuania: "EUROPE",
  Iceland: "EUROPE",
  Albania: "EUROPE",
  Serbia: "EUROPE",
  Montenegro: "EUROPE",
  "North Macedonia": "EUROPE",
  "Bosnia and Herzegovina": "EUROPE",
  Kosovo: "EUROPE",
  Moldova: "EUROPE",
  Ukraine: "EUROPE",
  Belarus: "EUROPE",

  // AFRICA Zone
  Kenya: "AFRICA",
  Tanzania: "AFRICA",
  Uganda: "AFRICA",
  Rwanda: "AFRICA",
  Burundi: "AFRICA",
  Ethiopia: "AFRICA",
  Somalia: "AFRICA",
  Djibouti: "AFRICA",
  Eritrea: "AFRICA",
  "South Sudan": "AFRICA",
  "South Africa": "AFRICA",
  Zambia: "AFRICA",
  Zimbabwe: "AFRICA",
  Botswana: "AFRICA",
  Namibia: "AFRICA",
  Mozambique: "AFRICA",
  Malawi: "AFRICA",
  Madagascar: "AFRICA",
  Mauritius: "AFRICA",
  Seychelles: "AFRICA",
  Comoros: "AFRICA",
  Lesotho: "AFRICA",
  Eswatini: "AFRICA",
  Swaziland: "AFRICA",

  // MIDDLEEAST Zone
  "Saudi Arabia": "MIDDLEEAST",
  "United Arab Emirates": "MIDDLEEAST",
  UAE: "MIDDLEEAST",
  Dubai: "MIDDLEEAST",
  Qatar: "MIDDLEEAST",
  Kuwait: "MIDDLEEAST",
  Bahrain: "MIDDLEEAST",
  Oman: "MIDDLEEAST",
  Jordan: "MIDDLEEAST",
  Lebanon: "MIDDLEEAST",
  Syria: "MIDDLEEAST",
  Iraq: "MIDDLEEAST",
  Yemen: "MIDDLEEAST",
  Israel: "MIDDLEEAST",
  Palestine: "MIDDLEEAST",
  Turkey: "MIDDLEEAST",
  Iran: "MIDDLEEAST",

  // ASIA Zone
  China: "ASIA",
  Japan: "ASIA",
  "South Korea": "ASIA",
  India: "ASIA",
  Pakistan: "ASIA",
  Bangladesh: "ASIA",
  "Sri Lanka": "ASIA",
  Nepal: "ASIA",
  Bhutan: "ASIA",
  Maldives: "ASIA",
  Afghanistan: "ASIA",
  Thailand: "ASIA",
  Vietnam: "ASIA",
  Malaysia: "ASIA",
  Singapore: "ASIA",
  Indonesia: "ASIA",
  Philippines: "ASIA",
  Myanmar: "ASIA",
  Cambodia: "ASIA",
  Laos: "ASIA",
  Brunei: "ASIA",
  Mongolia: "ASIA",
  Taiwan: "ASIA",
  "Hong Kong": "ASIA",
  Macau: "ASIA",
  "North Korea": "ASIA",
  "Timor-Leste": "ASIA",
  "Papua New Guinea": "ASIA",
  Australia: "ASIA",
  "New Zealand": "ASIA",
  Fiji: "ASIA",

  // SOUTH_AMERICA Zone
  Brazil: "SOUTH_AMERICA",
  Argentina: "SOUTH_AMERICA",
  Chile: "SOUTH_AMERICA",
  Colombia: "SOUTH_AMERICA",
  Peru: "SOUTH_AMERICA",
  Venezuela: "SOUTH_AMERICA",
  Ecuador: "SOUTH_AMERICA",
  Bolivia: "SOUTH_AMERICA",
  Paraguay: "SOUTH_AMERICA",
  Uruguay: "SOUTH_AMERICA",
  Guyana: "SOUTH_AMERICA",
  Suriname: "SOUTH_AMERICA",
  "French Guiana": "SOUTH_AMERICA",
  Mexico: "SOUTH_AMERICA",
  Guatemala: "SOUTH_AMERICA",
  Honduras: "SOUTH_AMERICA",
  "El Salvador": "SOUTH_AMERICA",
  Nicaragua: "SOUTH_AMERICA",
  "Costa Rica": "SOUTH_AMERICA",
  Panama: "SOUTH_AMERICA",
  Belize: "SOUTH_AMERICA",
  Cuba: "SOUTH_AMERICA",
  Jamaica: "SOUTH_AMERICA",
  Haiti: "SOUTH_AMERICA",
  "Dominican Republic": "SOUTH_AMERICA",
  "Trinidad and Tobago": "SOUTH_AMERICA",
  Barbados: "SOUTH_AMERICA",
  Bahamas: "SOUTH_AMERICA",
};

/**
 * Get zone for a country name
 * Case-insensitive lookup
 */
export function getZoneForCountry(country: string): string | null {
  // Normalize the country name
  const normalizedCountry = country.trim();

  // Try exact match first
  if (COUNTRY_TO_ZONE[normalizedCountry]) {
    return COUNTRY_TO_ZONE[normalizedCountry];
  }

  // Try case-insensitive match
  const lowerCountry = normalizedCountry.toLowerCase();
  for (const [key, value] of Object.entries(COUNTRY_TO_ZONE)) {
    if (key.toLowerCase() === lowerCountry) {
      return value;
    }
  }

  return null;
}

/**
 * Get all countries in a zone
 */
export function getCountriesInZone(zone: string): string[] {
  return Object.entries(COUNTRY_TO_ZONE)
    .filter(([_, zoneValue]) => zoneValue === zone)
    .map(([country, _]) => country);
}

/**
 * Get all available zones
 */
export function getAllZones(): string[] {
  return Array.from(new Set(Object.values(COUNTRY_TO_ZONE)));
}
