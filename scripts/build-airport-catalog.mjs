// Generate the checked-in worldwide catalog from local, sourced downloads.
// node scripts/build-airport-catalog.mjs airports.csv countries.csv timezones.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import tzLookup from 'tz-lookup';

function csv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(field); field = ''; }
    else if (c === '\n' && !quoted) { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const header = rows.shift();
  return rows.filter(r => r.length === header.length).map(r => Object.fromEntries(header.map((key, i) => [key, r[i]])));
}
const [airportPath, countryPath, timezonePath] = process.argv.slice(2);
if (!timezonePath) throw new Error('Provide local airports.csv, countries.csv and mwgg airports.json paths. See docs/airport-data.md.');
const airportText = readFileSync(airportPath, 'utf8');
const countryText = readFileSync(countryPath, 'utf8');
const timezoneText = readFileSync(timezonePath, 'utf8');
const countries = new Map(csv(countryText).map(c => [c.code, c.name]));
const timezoneData = JSON.parse(timezoneText);
const timezonesByCode = new Map(Object.values(timezoneData).filter(a => a.iata).map(a => [a.iata, a]));
const displayCities = { NRT: 'Tokyo', DEL: 'Delhi', ICN: 'Seoul', YYZ: 'Toronto', CDG: 'Paris' };
const aliases = { PEK: 'Peking Beijing', PKX: 'Peking Beijing', BOM: 'Bombay', BLR: 'Bangalore', CCU: 'Calcutta', SGN: 'Saigon', RGN: 'Rangoon', HKG: 'Hong Kong', ICN: 'Seoul', NRT: 'Tokyo', LHR: 'UK Britain England', LGW: 'UK Britain England', JFK: 'NYC USA US', LGA: 'NYC USA US', EWR: 'NYC USA US' };
let derivedTimezones = 0;
const codes = new Set();
const airports = csv(airportText).filter(a => /^[A-Z]{3}$/.test(a.iata_code) &&
  ['large_airport', 'medium_airport', 'small_airport'].includes(a.type) &&
  (a.scheduled_service === 'yes' || a.type !== 'small_airport')).map(a => {
  const lat = Number(a.latitude_deg), lon = Number(a.longitude_deg);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) throw new Error('Invalid coordinates for ' + a.iata_code);
  if (codes.has(a.iata_code)) throw new Error('Duplicate IATA code: ' + a.iata_code);
  codes.add(a.iata_code);
  const candidate = timezoneData[a.ident] ?? timezonesByCode.get(a.iata_code);
  let timezone = candidate?.country === a.iso_country ? candidate.tz : undefined;
  try { if (!timezone) throw new Error(); new Intl.DateTimeFormat('en', { timeZone: timezone }); }
  catch { timezone = tzLookup(lat, lon); derivedTimezones++; }
  const municipality = a.municipality || a.name;
  const city = displayCities[a.iata_code] ?? municipality.replace(/\s+\([^)]*\)$/, '');
  const searchAliases = [city !== municipality ? municipality : '', aliases[a.iata_code]].filter(Boolean).join(' ');
  return {
    code: a.iata_code, city, name: a.name,
    country: countries.get(a.iso_country) ?? a.iso_country, countryCode: a.iso_country,
    timezone, lat, lon, size: a.type === 'large_airport' ? 3 : a.type === 'medium_airport' ? 2 : 1,
    scheduled: a.scheduled_service === 'yes',
    ...(searchAliases ? { aliases: searchAliases } : {}),
  };
}).sort((a, b) => a.code.localeCompare(b.code));
if (airports.length < 4000 || new Set(airports.map(a => a.countryCode)).size < 200) throw new Error('Incomplete worldwide catalog.');
mkdirSync('src/data', { recursive: true });
writeFileSync('src/data/airports.json', JSON.stringify(airports) + '\n');
const sha = text => createHash('sha256').update(text).digest('hex');
writeFileSync('src/data/airport-catalog.json', JSON.stringify({
  generatedOn: new Date().toISOString().slice(0, 10),
  airportCount: airports.length, countryCount: new Set(airports.map(a => a.countryCode)).size,
  derivedTimezones, sources: [
    { url: 'https://github.com/davidmegginson/ourairports-data', file: 'airports.csv', sha256: sha(airportText), license: 'Unlicense' },
    { url: 'https://github.com/davidmegginson/ourairports-data', file: 'countries.csv', sha256: sha(countryText), license: 'Unlicense' },
    { url: 'https://github.com/mwgg/Airports', file: 'airports.json', sha256: sha(timezoneText), license: 'MIT' },
  ],
}, null, 2) + '\n');
console.log(JSON.stringify({ airports: airports.length, countries: new Set(airports.map(a => a.countryCode)).size, derivedTimezones }));
