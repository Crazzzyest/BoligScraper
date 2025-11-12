# Oppsett for GitHub Actions

## Steg 1: Konfigurer GitHub Secrets

Gå til ditt repository på GitHub → Settings → Secrets and variables → Actions → New repository secret

Legg til følgende secrets:

### 1. GOOGLE_API_KEY
- Navn: `GOOGLE_API_KEY`
- Verdi: Din Google API-nøkkel (fra Google Cloud Console)

### 2. GOOGLE_SERVICE_ACCOUNT_KEY
- Navn: `GOOGLE_SERVICE_ACCOUNT_KEY`
- Verdi: Hele JSON-innholdet fra service account key-filen du lastet ned fra Google Cloud

**Eksempel på format** (ikke bruk denne, bruk din egen!):
```json
{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service@your-project.iam.gserviceaccount.com",...}
```

## Steg 2: Push koden til GitHub

```bash
git add .
git commit -m "Add GitHub Actions daily search workflow"
git push
```

## Steg 3: Verifiser at Google Sheets er delt

Sørg for at regnearket er delt med service account-eposten som du finner i JSON-filen (under `client_email`).

Gå til Google Sheets → Del → legg til service account-eposten med "Rediger"-tilgang.

## Steg 4: Test workflow manuelt

1. Gå til GitHub → Actions-fanen i repoet ditt
2. Velg "Daily Property Search" workflow
3. Klikk "Run workflow" for å kjøre manuelt

## Automatisk kjøring

Workflow kjører automatisk hver dag kl. 06:00 UTC (07:00/08:00 norsk tid).

## Søkeparametere

Konfigurert i `.github/workflows/daily-search.yml`:
- **FINN URL**: Boliger i Trondheim, pris opptil 9M, nyeste først
- **Arbeid A**: Idrettsbygget Gløshaugen, Chr. Frederiks gate 20, 7030 Trondheim
- **Arbeid B**: Prinsesse Kristinas gate 3, 7030 Trondheim  
- **Maks reisetid**: 11 minutter

## Resultater

Resultatene legges automatisk i Google Sheets:
https://docs.google.com/spreadsheets/d/1cdHG_d8wV5Nc6XwAYXd1mZVSXqnl14D4-XDYl5pMcvg/

Hver kjøring legger til:
- Tidsstempel og søkeparametere
- Alle leiligheter med tittel, pris, adresse, URL
- Reisetid til begge arbeidsplasser
- Om leiligheten passerer filteret (JA/NEI)
