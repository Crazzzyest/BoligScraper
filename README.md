# BoligScraper - FINN.no Reisevei-søk

🏠 Automatisert eiendomssøk basert på reisevei mellom to arbeidssteder.

## ✨ Funksjoner

- 🔍 Crawler leilighetsannonser fra FINN.no
- 🗺️ Beregner reisetid til to arbeidsadresser via Google Distance Matrix API
- 🚗 Støtter 4 transportmetoder: bil, sykkel, gange, kollektivtransport
- 📍 Interaktivt kart med markører for alle leiligheter
- ⚡ Filtrerer automatisk basert på maks reisetid

## 🚀 Deploy til Vercel (anbefalt for enkel deling)

### 1-klikks deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCrazzzyest%2FBoligScraper&env=GOOGLE_API_KEY&envDescription=Google%20API%20key%20med%20Distance%20Matrix%20og%20Maps%20JavaScript%20API%20aktivert&project-name=boligscraper&repository-name=boligscraper)

### Manuell Vercel deploy

1. **Installer Vercel CLI:**
```bash
npm i -g vercel
```

2. **Deploy:**
```bash
vercel
```

3. **Legg til environment variables i Vercel dashboard:**
   - Gå til prosjektets Settings → Environment Variables
   - Legg til: `GOOGLE_API_KEY` = din Google API-nøkkel

4. **Aktiver nødvendige Google APIs:**
   - [Distance Matrix API](https://console.cloud.google.com/apis/library/distancematrix-backend.googleapis.com)
   - [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)

## 🐳 Lokal kjøring med Docker

```bash
# Klon repo
git clone https://github.com/Crazzzyest/BoligScraper.git
cd BoligScraper

# Opprett .env fil
cp .env.example .env
# Rediger .env og legg inn GOOGLE_API_KEY

# Start med Docker
docker-compose up --build
```

Åpne http://localhost:3000

## 💻 Lokal utvikling uten Docker

```bash
npm install
npm run install-playwright  # Installerer Chromium for Playwright
npm start
```

## 📝 Bruk

1. Lim inn en FINN.no søke-URL (f.eks. `https://www.finn.no/realestate/homes/search.html?location=1.20016.20318`)
2. Skriv inn adressene til to arbeidssteder
3. Velg transportmetode
4. Sett maks reisetid (minutter)
5. Klikk "Søk"

Resultater vises både som liste og på interaktivt kart.

## ⚙️ Konfigurasjon

Environment variables (`.env` eller Vercel Settings):

- `GOOGLE_API_KEY` - **Påkrevd**. Google API-nøkkel med Distance Matrix og Maps aktivert
- `MAX_LISTINGS` - Maks antall annonser å sjekke (standard: 10 for Vercel, 20 for Docker)
- `PORT` - Port for lokal server (standard: 3000)

## 🧪 Testing

Test med eksempel-søk:
- **FINN URL:** `https://www.finn.no/realestate/homes/search.html?location=1.20016.20318`
- **Arbeid A:** `Prinsesse Kristinas gate 3, 7030 Trondheim`
- **Arbeid B:** `Idrettsbygget Gløshaugen, Chr. Frederiks gate 20, 7030 Trondheim`
- **Maks tid:** 45 minutter

## 📦 Teknologi

- **Frontend:** Vanilla JS + Google Maps JavaScript API
- **Backend:** Node.js serverless functions (Vercel)
- **Crawler:** Playwright (headless Chromium)
- **API:** Google Distance Matrix API

## ⚠️ Viktig informasjon

- **FINN.no API:** Krever avtale med FINN. Denne løsningen bruker web scraping via Playwright
- **Vercel timeout:** Free tier = 10s per function. For mange annonser kan du trenge Pro ($20/mnd) med 60s timeout
- **Google API kostnader:** Distance Matrix API har gratis tier ($200 credit/mnd). Sjekk [pricing](https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing)

## 🤝 Bidrag

Pull requests er velkomne! For større endringer, åpne først en issue.

## 📄 Lisens

[MIT](LICENSE)

---

**Utviklet med ❤️ for enklere boligjakt**


