# Eiendomssøk prototype — reisevei-basert filter

Denne prototypen viser en minimal, lokal implementasjon av kravene:

- Crawler (Playwright) for å hente FINN.no-annonser fra en oppgitt FINN-søk-URL.
- Google Distance Matrix-integrasjon for å beregne reisetid til to arbeidsadresser.
- Enkel Express-backend som eksponerer et API og serverer en liten front-end UI.
- SQLite for enkel caching av resultater.

Viktig: Dette er en prototype for lokal testing. For produksjon må crawlingen kjøres server-side (Playwright/Puppeteer), og du må følge FINN.no sine retningslinjer/robots.txt og eventuelle API-avtaler.

Krav
- Node 18+ / npm
- Google API-nøkkel med tilgang til Distance Matrix (og Geocoding hvis du vil geokode adresser).

Rask start

1) Kopier `.env.example` til `.env` og fyll inn `GOOGLE_API_KEY`.

2) (Valgfritt) Sett opp Google Sheets-eksport:
   - Opprett et Google Cloud-prosjekt på https://console.cloud.google.com/
   - Aktiver Google Sheets API
   - Lag en "service account" og last ned JSON-nøkkelfilen
   - Del målregnearket ditt med service account-eposten (f.eks. `my-service@my-project.iam.gserviceaccount.com`)
   - Sett `GOOGLE_SERVICE_ACCOUNT_KEY_FILE=/path/to/service-account-key.json` i `.env`

3) Installer avhengigheter og Playwright-browsers:

```powershell
npm install
npx playwright install --with-deps
```

4) Start serveren:

```powershell
npm start
```

5) Åpne http://localhost:3000 og test med en FINN search-results URL eller en kort prøve-URL.

Bruk
- I UI: lim inn `finnUrl` (søkeresultatside på FINN), `workA` og `workB` (adresser eller koordinater), velg maks antall minutter og trykk Søk.

Arkitektur og neste steg for produksjon
- Kjøre crawler i et jobbsystem (cron / queue) med robust rate-limiting.
- Bruk offisiell FINN API hvis tilgjengelig, ellers nøye overhold robots.txt.
- Backend-proxy for Google API-kall for å beskytte API-nøkkel.
- Bedre geokoding, robustere selectors for FINN, og mer komplett datamodell (bilder, areal, rom, m.m.).

Docker (anbefalt hvis du ikke vil oppgradere Node lokalt)
---------------------------------------------------
Dette repoet inkluderer en Dockerfile og `docker-compose.yml` som bruker Playwrights offisielle image (inneholder nettleser-binarier).

Bygg og kjør med Docker (PowerShell):

```powershell
docker build -t bolig-reisevei-prototype:latest .
docker run --rm -p 3000:3000 --env-file .env -v ${PWD}:/app bolig-reisevei-prototype:latest
```

Eller med docker-compose:

```powershell
docker-compose up --build
```

Volumer: `data.sqlite` mappes ut i repo-roten for enkel vedvarende caching.

Merk: dersom du kjører i WSL/Windows, pass på at filrettigheter og paths fungerer som forventet.

