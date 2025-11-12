# Deploy til Vercel

Denne guiden viser steg-for-steg hvordan du deployer BoligScraper til Vercel.

## Forutsetninger

- GitHub-konto
- Google Cloud-prosjekt med Distance Matrix API og Maps JavaScript API aktivert
- Google API-nøkkel

## Steg 1: Forbered Google API

1. Gå til [Google Cloud Console](https://console.cloud.google.com/)
2. Opprett nytt prosjekt eller velg eksisterende
3. Aktiver disse APIene:
   - [Distance Matrix API](https://console.cloud.google.com/apis/library/distancematrix-backend.googleapis.com)
   - [Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
4. Opprett API-nøkkel under "Credentials"
5. (Anbefalt) Begrens API-nøkkelen til kun disse to APIene

## Steg 2: Deploy til Vercel

### Alternativ A: 1-klikks deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCrazzzyest%2FBoligScraper&env=GOOGLE_API_KEY&envDescription=Google%20API%20key%20med%20Distance%20Matrix%20og%20Maps%20JavaScript%20API%20aktivert&project-name=boligscraper&repository-name=boligscraper)

Klikk på knappen over og følg instruksjonene. Du vil bli bedt om å lime inn din Google API-nøkkel.

### Alternativ B: Manuell deploy via CLI

1. **Installer Vercel CLI:**
```bash
npm i -g vercel
```

2. **Logg inn:**
```bash
vercel login
```

3. **Deploy fra prosjektmappen:**
```bash
cd BoligScraper
vercel
```

4. **Følg promptene:**
   - Set up and deploy? → Y
   - Which scope? → Velg din konto
   - Link to existing project? → N
   - Project name? → boligscraper (eller valgfritt navn)
   - Directory? → ./
   - Override settings? → N

5. **Legg til environment variable:**
```bash
vercel env add GOOGLE_API_KEY
```
Lim inn API-nøkkelen din når du blir spurt.

6. **Redeploy for å aktivere environment variable:**
```bash
vercel --prod
```

### Alternativ C: Deploy via Vercel Dashboard

1. Gå til [vercel.com](https://vercel.com/)
2. Klikk "Add New..." → "Project"
3. Importer GitHub-repoet ditt (Crazzzyest/BoligScraper)
4. Konfigurer prosjektet:
   - **Framework Preset:** Other
   - **Root Directory:** ./
   - **Build Command:** (la stå tom)
   - **Output Directory:** public
5. Legg til environment variables:
   - `GOOGLE_API_KEY` = din API-nøkkel
6. Klikk "Deploy"

## Steg 3: Test deployment

1. Åpne den deployde URL-en (f.eks. `https://boligscraper.vercel.app`)
2. Test med eksempel-søk:
   - **FINN URL:** `https://www.finn.no/realestate/homes/search.html?location=1.20016.20318`
   - **Arbeid A:** `Prinsesse Kristinas gate 3, 7030 Trondheim`
   - **Arbeid B:** `Idrettsbygget Gløshaugen, Chr. Frederiks gate 20, 7030 Trondheim`
   - **Maks tid:** 45 minutter

## Viktige merknader

### Timeout-begrensninger

- **Vercel Free Tier:** Maks 10 sekunder per serverless function
- **Vercel Pro ($20/mnd):** Maks 60 sekunder per serverless function

Hvis du får timeout-feil, kan du:
1. Redusere `MAX_LISTINGS` environment variable (standard: 10)
2. Oppgradere til Vercel Pro
3. Optimere crawler-koden

### Google API kostnader

Distance Matrix API bruker Google Cloud credits:
- **Gratis tier:** $200/måned
- **Pris:** ~$0.005 per element (2 destinasjoner per søk)
- **Eksempel:** 1000 søk = ~$10

Sjekk [prising](https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing)

### FINN.no retningslinjer

Dette verktøyet bruker web scraping. Vær oppmerksom på:
- Respekter `robots.txt` (inkludert i crawler)
- Ikke overbelast serverne
- Bruk rimelig `MAX_LISTINGS` verdi
- Offisielt FINN API krever avtale

## Feilsøking

### "Function execution timed out"
→ Redusere `MAX_LISTINGS` eller oppgrader til Pro

### "ZERO_RESULTS" fra Google API
→ Sjekk at arbeidsadressene er korrekte og i Norge

### Tomt kart
→ Coordinates ekstraheres ikke fra FINN. Dette er en kjent begrensning.

### "Missing GOOGLE_API_KEY"
→ Sjekk at environment variable er satt i Vercel dashboard

## Oppdatere deployment

Når du pusher endringer til GitHub, redeployer Vercel automatisk:

```bash
git add .
git commit -m "Oppdatering"
git push origin main
```

Deployment-status vises på Vercel dashboard.
