# Worldwide airport catalog

The checked-in catalog is generated from [OurAirports](https://github.com/davidmegginson/ourairports-data) airport/country data (public domain, Unlicense) and [mwgg/Airports](https://github.com/mwgg/Airports) time zones (MIT). Their license notices are included in `THIRD_PARTY_NOTICES.md`.

The catalog includes airports with three-letter IATA codes, valid coordinates, and an airport type of large or medium, plus smaller airports marked as having scheduled service. Closed airports, heliports, seaplane bases and non-IATA airfields are excluded. Airport inclusion does not guarantee a particular airline operates there or that a live fare is available. Country totals include dependent territories.

Names, municipalities, countries and coordinates use OurAirports. City display labels remove trailing suburb qualifiers and use familiar metro names for a few major airports; the original municipality remains searchable as an alias. Time zones use mwgg where the matching airport and country have a valid IANA zone; missing zones are derived from coordinates with `tz-lookup`. Derived zones should be reviewed near time-zone boundaries. These zones are used only to render illustrative demo flight times; live provider flight times are preserved as returned.

`src/data/airport-catalog.json` records the generation date, counts and SHA-256 hashes of the input files. Airport data changes over time; refresh and review the catalog before launch and periodically afterwards.

To refresh, download the upstream input files, then run:

```bash
curl -fL -o /tmp/airports.csv https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv
curl -fL -o /tmp/countries.csv https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/countries.csv
curl -fL -o /tmp/timezones.json https://raw.githubusercontent.com/mwgg/Airports/master/airports.json
node scripts/build-airport-catalog.mjs /tmp/airports.csv /tmp/countries.csv /tmp/timezones.json
npm test
npm run build
```

Normal installation, search and deployment use the checked-in catalog and do not fetch these sources. `tz-lookup` is a development dependency used only for catalog generation.
