# BoligScraper - Automatisert eiendomssøk basert på reisevei

Automatisert system for å søke etter boliger på FINN.no og filtrere basert på reisetid til arbeidsplasser. Systemet kjører daglig via GitHub Actions og eksporterer resultater til Google Sheets.

## Funksjoner

- 🏠 **Automatisk crawling** av FINN.no søkeresultater med Playwright
- 🚗 **Reisetidsberegning** til to arbeidsadresser med Google Distance Matrix API
- 📊 **Google Sheets-eksport** for enkel oppfølging av nye boliger
- ⚡ **SQLite-caching** for å unngå unødvendige API-kall
- 🤖 **GitHub Actions** for daglig automatisk kjøring
- 🗺️ **Interaktivt kart** (valgfritt web UI for lokal testing)

## Arkitektur

### Hovedkomponenter

- **`src/crawler.js`** - Playwright-basert web scraper for FINN.no
- **`src/distance.js`** - Google Distance Matrix API-integrasjon med trafikk-modellering
- **`src/db.js`** - SQLite database for caching av resultater
- **`src/sheets.js`** - Google Sheets API-integrasjon for eksport
- **`src/server.js`** - Express backend med REST API (valgfri for lokal bruk)
- **`run-search.js`** - CLI-script for automatisert kjøring
- **`.github/workflows/daily-search.yml`** - GitHub Actions workflow

### Dataflyt

```
FINN.no → Crawler → Distance Matrix API → SQLite Cache → Google Sheets
                                                        ↓
                                              GitHub Actions (daglig)
```

## Oppsett

### Forutsetninger

- Node.js 18+ / npm
- Google Cloud-konto med følgende API-er aktivert:
  - Distance Matrix API
  - Google Sheets API
- GitHub-konto (for automatisk kjøring)

### Lokal installasjon (valgfritt)

```powershell
# 1. Klon repository
git clone https://github.com/Crazzzyest/BoligScraper.git
cd BoligScraper

# 2. Installer avhengigheter
npm install

# 3. Installer Playwright browsers
npx playwright install --with-deps

# 4. Konfigurer miljøvariabler
cp .env.example .env
# Rediger .env med dine API-nøkler
```

### Google Cloud-oppsett

#### 1. Distance Matrix API

1. Gå til [Google Cloud Console](https://console.cloud.google.com/)
2. Opprett nytt prosjekt eller bruk eksisterende
3. Aktiver **Distance Matrix API**
4. Opprett API-nøkkel under "Credentials"
5. Kopier API-nøkkelen til `.env` eller GitHub Secrets

#### 2. Google Sheets API

1. I samme Google Cloud-prosjekt, aktiver **Google Sheets API**
2. Opprett **Service Account**:
   - Gå til "IAM & Admin" → "Service Accounts"
   - Klikk "Create Service Account"
   - Gi navn (f.eks. "boligscraper")
   - Klikk "Create and Continue"
   - Hopp over roller og klikk "Done"
3. Opprett JSON-nøkkel:
   - Klikk på service account
   - Gå til "Keys"-fanen
   - "Add Key" → "Create new key" → "JSON"
   - Last ned JSON-filen
4. Del Google Sheets-dokumentet:
   - Åpne regnearket der resultatene skal lagres
   - Klikk "Del"
   - Legg til service account-eposten (finner du i JSON-filen under `client_email`)
   - Gi "Rediger"-tilgang

### GitHub Actions-oppsett

#### 1. Konfigurer Secrets

Gå til repository på GitHub → Settings → Secrets and variables → Actions

Legg til følgende secrets:

**GOOGLE_API_KEY**
```
Din Google API-nøkkel fra steg over
```

**GOOGLE_SERVICE_ACCOUNT_KEY**
```json
{"type":"service_account","project_id":"...","private_key":"..."}
```
> 💡 **Tips**: Kopier hele innholdet fra JSON-filen lastet ned fra Google Cloud

#### 2. Tilpass søkeparametere

Rediger `.github/workflows/daily-search.yml`:

```yaml
env:
  FINN_URL: 'https://www.finn.no/realestate/homes/search.html?...'
  WORK_A: 'Din arbeidsplass A-adresse'
  WORK_B: 'Din arbeidsplass B-adresse'
  MAX_MINUTES: '11'
```

#### 3. Kjør workflow

- **Automatisk**: Kjører hver dag kl. 06:00 UTC (07:00/08:00 norsk tid)
- **Manuelt**: GitHub → Actions → "Daily Property Search" → "Run workflow"

## Bruk

### CLI-script (lokal eller i GitHub Actions)

```bash
# Med miljøvariabler
export FINN_URL="https://www.finn.no/realestate/homes/search.html?..."
export WORK_A="Adresse 1"
export WORK_B="Adresse 2"
export MAX_MINUTES="15"
node run-search.js
```

### Web UI (kun lokal testing)

```bash
npm start
# Åpne http://localhost:3000
```

### Docker (lokal testing)

```bash
docker-compose up --build
```

## Miljøvariabler

| Variabel | Beskrivelse | Påkrevd |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google API-nøkkel for Distance Matrix | ✅ Ja |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON (som string) | ✅ Ja* |
| `GOOGLE_SERVICE_ACCOUNT_KEY_FILE` | Sti til service account JSON-fil | ✅ Ja* |
| `FINN_URL` | FINN.no søke-URL | ✅ Ja |
| `WORK_A` | Arbeidsadresse A | ✅ Ja |
| `WORK_B` | Arbeidsadresse B | ✅ Ja |
| `MAX_MINUTES` | Maks reisetid i minutter | ✅ Ja |
| `PORT` | Server port (kun web UI) | ❌ Nei (default: 3000) |
| `PLAYWRIGHT_HEADLESS` | Kjør Playwright headless | ❌ Nei (default: true) |
| `MAX_LISTINGS` | Maks antall annonser å prosessere | ❌ Nei (default: 50) |

\* *Én av de to Google Sheets-variablene må være satt*

## Output

### Google Sheets-format

Hver kjøring legger til følgende i regnearket:

| Søk kjørt | Timestamp | FINN URL | Arbeid A | Arbeid B | Maks minutter |
|-----------|-----------|----------|----------|----------|---------------|
| 2025-11-12T06:00:00Z | ... | ... | ... | ... | 11 min |

| Tittel | Pris | Adresse | URL | Arbeid A (min) | Arbeid B (min) | Passerer filter? |
|--------|------|---------|-----|----------------|----------------|------------------|
| 2-roms leilighet | 2 500 000 kr | Gate 1 | finn.no/... | 8 | 10 | JA |
| 3-roms leilighet | 3 200 000 kr | Gate 2 | finn.no/... | 15 | 12 | NEI |

### Console output (GitHub Actions logs)

```
Starting property search...
Crawling FINN.no...
Found 25 listings

Processing: Pen 2-roms leilighet
  Calculating travel times...
  Work A: 8 min, Work B: 10 min - PASS

=== SUMMARY ===
Total listings: 25
Passed filter: 3
Failed filter: 22

Exporting to Google Sheets...
Successfully exported to Google Sheets
```

## Hvordan det fungerer

### 1. Crawling (Playwright)

Systemet:
- Åpner FINN.no søke-URL
- Finner alle annonse-lenker (`/realestate/homes/ad.html?finnkode=...`)
- For hver annonse: ekstraherer tittel, pris, adresse

### 2. Reisetidsberegning (Google Distance Matrix)

- Beregner reisetid fra bolig til begge arbeidsplasser
- Bruker mandag kl. 07:00 som referanse (pendlertid)
- Inkluderer trafikk-estimat (`traffic_model=best_guess`)
- Cacher resultater i SQLite for å spare API-kall

### 3. Filtrering

Boliger godkjennes hvis:
```javascript
(reisetid_til_A <= MAX_MINUTES) && (reisetid_til_B <= MAX_MINUTES)
```

### 4. Eksport til Google Sheets

- Alle resultater (både godkjente og ikke-godkjente) logges
- Hver kjøring får eget tidsstempel og søkeparametere
- Kolonne "Passerer filter?" viser JA/NEI

## Feilsøking

### Playwright installer feiler lokalt

**Problem**: `npx playwright install --with-deps` feiler på Windows

**Løsning**: Bruk Docker i stedet:
```bash
docker-compose up --build
```

### Google Sheets-feil: "Unable to parse range"

**Problem**: Sheet-fanen finnes ikke

**Løsning**: 
1. Åpne Google Sheets-dokumentet
2. Sjekk at fanen heter "Ark1" (norsk) eller "Sheet1" (engelsk)
3. Eller endre `SHEET_NAME` i `src/sheets.js`

### Distance Matrix returnerer ZERO_RESULTS

**Problem**: Kan ikke finne rute til adressen

**Løsning**: 
- Sjekk at adressene er korrekte og spesifikke
- Inkluder postnummer og sted (f.eks. "Gate 1, 7030 Trondheim")
- Test adressene i Google Maps først

### GitHub Actions feiler med secrets

**Problem**: `GOOGLE_SERVICE_ACCOUNT_KEY` ikke funnet

**Løsning**:
1. Gå til Settings → Secrets and variables → Actions
2. Verifiser at secret er lagt til
3. Sjekk at navnet er eksakt `GOOGLE_SERVICE_ACCOUNT_KEY`
4. JSON må være på én linje uten anførselstegn rundt

## Ytterligere dokumentasjon

- [GitHub Actions oppsettguide](GITHUB_ACTIONS_SETUP.md) - Detaljert guide for GitHub Actions
- [Deploy-guide](DEPLOY.md) - Deployment-alternativer (hvis relevant)
- [FINN.no robots.txt](https://www.finn.no/robots.txt) - Respekter crawling-regler

## Lisens

Se [LICENSE](LICENSE)

## Viktige merknader

⚠️ **Ansvarlig bruk av web scraping**:
- Dette verktøyet er kun for personlig bruk
- Respekter FINN.no sine [brukervilkår](https://www.finn.no/brukervilkar)
- Ikke overbelast serverne (bruk caching og rate limiting)
- Vurder FINN API hvis tilgjengelig for kommersiell bruk

⚠️ **API-kostnader**:
- Google Distance Matrix API har gratis kvote, men koster etter det
- Følg med på bruk i [Google Cloud Console](https://console.cloud.google.com/)
- Sett opp billing alerts

⚠️ **Personvern**:
- `.env`-filen inneholder API-nøkler og er i `.gitignore`
- Aldri commit API-nøkler til Git
- Bruk GitHub Secrets for automatisering

