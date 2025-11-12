require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const crawler = require('./crawler');
const distance = require('./distance');
const db = require('./db');
const sheets = require('./sheets');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Endpoint to get Google Maps API key for frontend
app.get('/api/config', (req, res) => {
  res.json({ 
    googleMapsApiKey: process.env.GOOGLE_API_KEY || '' 
  });
});

// Simple search endpoint: body { finnUrl, workA, workB, maxMinutes }
app.post('/api/search', async (req, res) => {
  const { finnUrl, workA, workB, maxMinutes } = req.body;
  if (!finnUrl || !workA || !workB) return res.status(400).json({ error: 'Missing parameters' });

  try {
    // Crawl listings
    const listings = await crawler.scrapeFinnSearch(finnUrl, { max: parseInt(process.env.MAX_LISTINGS || '20') });

    // For each listing, compute distances to both workplaces (with caching)
    const results = [];
    for (const listing of listings) {
      const cached = await db.getCachedListing(listing.url);
      let travel = null;
      if (cached && cached.workA && cached.workB) {
        travel = { workA: cached.workA, workB: cached.workB };
      } else {
        // Call Google Distance Matrix
        travel = await distance.getTravelTimes(listing.address || listing.title, workA, workB);
        await db.saveListing(listing, travel);
      }

      const passes = (travel.workA.duration_minutes <= (maxMinutes || 60)) && (travel.workB.duration_minutes <= (maxMinutes || 60));
      results.push({ listing, travel, passes });
    }

    // Export results to Google Sheets if configured
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
      await sheets.appendResultsToSheet(results, { finnUrl, workA, workB, maxMinutes }).catch(err => {
        console.warn('Failed to export to Google Sheets:', err.message);
      });
    }

    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
