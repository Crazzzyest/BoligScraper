'use strict';
const { google } = require('googleapis');

const SPREADSHEET_ID = '1cdHG_d8wV5Nc6XwAYXd1mZVSXqnl14D4-XDYl5pMcvg';
const SHEET_NAME = 'Ark1'; // Default first sheet name in Norwegian Google Sheets

async function appendResultsToSheet(results, searchParams) {
  try {
    // Authenticate with Google Sheets API using service account
    // Supports both GOOGLE_SERVICE_ACCOUNT_KEY (JSON string) and GOOGLE_SERVICE_ACCOUNT_KEY_FILE (file path)
    let auth;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      // Option 1: JSON content as environment variable
      const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
      // Option 2: Path to JSON file
      auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
    } else {
      throw new Error('Neither GOOGLE_SERVICE_ACCOUNT_KEY nor GOOGLE_SERVICE_ACCOUNT_KEY_FILE is set');
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Prepare rows to append
    const timestamp = new Date().toISOString();
    const rows = [
      ['Søk kjørt:', timestamp, `FINN: ${searchParams.finnUrl}`, `Arbeid A: ${searchParams.workA}`, `Arbeid B: ${searchParams.workB}`, `Maks: ${searchParams.maxMinutes} min`],
      ['Tittel', 'Pris', 'Adresse', 'URL', 'Arbeid A (min)', 'Arbeid B (min)', 'Passerer filter?']
    ];

    for (const r of results) {
      rows.push([
        r.listing.title || '',
        r.listing.price || '',
        r.listing.address || '',
        r.listing.url || '',
        r.travel.workA.duration_minutes,
        r.travel.workB.duration_minutes,
        r.passes ? 'JA' : 'NEI'
      ]);
    }

    // Add empty row separator
    rows.push([]);

    // Append to sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'RAW',
      resource: {
        values: rows
      }
    });

    console.log(`Successfully appended ${results.length} results to Google Sheets`);
    return true;
  } catch (error) {
    console.error('Failed to append to Google Sheets:', error.message);
    return false;
  }
}

module.exports = { appendResultsToSheet };
