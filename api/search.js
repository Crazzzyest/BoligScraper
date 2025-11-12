// Vercel Serverless Function
// Main search endpoint that crawls FINN and calculates travel times

import { chromium } from 'playwright-core';
import chromiumBin from '@sparticuz/chromium';

// Helper: Scrape FINN search results
async function scrapeFinnSearch(url, options = {}) {
  const max = options.max || 20;
  
  let browser;
  try {
    browser = await chromium.launch({
      args: chromiumBin.args,
      executablePath: await chromiumBin.executablePath(),
      headless: true
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Collect all ad links
    const links = await page.$$eval('a[href*="/realestate/homes/ad.html"]', (anchors) =>
      anchors.map((a) => a.href).filter((href, idx, arr) => arr.indexOf(href) === idx)
    );

    const listings = [];
    for (let i = 0; i < Math.min(links.length, max); i++) {
      const adUrl = links[i];
      try {
        await page.goto(adUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

        const data = await page.evaluate(() => {
          const result = { title: document.title, price: null, address: null, coordinates: null };

          // Extract price and address from dl/dt/dd structure
          const dls = document.querySelectorAll('dl');
          dls.forEach((dl) => {
            const dts = dl.querySelectorAll('dt');
            const dds = dl.querySelectorAll('dd');
            for (let j = 0; j < dts.length; j++) {
              const key = dts[j]?.textContent?.trim();
              const val = dds[j]?.textContent?.trim();
              if (key && val) {
                if (key.toLowerCase().includes('pris') || key.toLowerCase().includes('totalpris')) {
                  result.price = val;
                }
                if (key.toLowerCase().includes('adresse')) {
                  result.address = val;
                }
              }
            }
          });

          return result;
        });

        listings.push({ url: adUrl, ...data });
      } catch (err) {
        console.error(`Error scraping ${adUrl}:`, err.message);
      }
    }

    return listings;
  } finally {
    if (browser) await browser.close();
  }
}

// Helper: Calculate travel times using Google Distance Matrix API
async function getTravelTimes(originAddress, workA, workB, mode = 'driving') {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_API_KEY not configured');

  const origins = encodeURIComponent(originAddress);
  const destinations = encodeURIComponent(`${workA}|${workB}`);
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=${mode}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Distance Matrix API error: ${data.status}`);
  }

  const row = data.rows[0];
  if (!row || !row.elements || row.elements.length < 2) {
    throw new Error('Incomplete response from Distance Matrix API');
  }

  const workAData = row.elements[0];
  const workBData = row.elements[1];

  return {
    workA: {
      status: workAData.status,
      duration_minutes: workAData.duration ? Math.ceil(workAData.duration.value / 60) : null,
      distance_km: workAData.distance ? (workAData.distance.value / 1000).toFixed(1) : null
    },
    workB: {
      status: workBData.status,
      duration_minutes: workBData.duration ? Math.ceil(workBData.duration.value / 60) : null,
      distance_km: workBData.distance ? (workBData.distance.value / 1000).toFixed(1) : null
    }
  };
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { finnUrl, workA, workB, travelMode, maxMinutes } = req.body;

  if (!finnUrl || !workA || !workB) {
    return res.status(400).json({ error: 'Missing parameters: finnUrl, workA, workB required' });
  }

  try {
    // Step 1: Crawl listings
    const listings = await scrapeFinnSearch(finnUrl, { 
      max: parseInt(process.env.MAX_LISTINGS || '10') // Lower for serverless timeout limits
    });

    // Step 2: Calculate travel times for each listing
    const results = [];
    for (const listing of listings) {
      try {
        const travel = await getTravelTimes(
          listing.address || listing.title, 
          workA, 
          workB, 
          travelMode || 'driving'
        );

        const passes = 
          travel.workA.status === 'OK' && 
          travel.workB.status === 'OK' &&
          travel.workA.duration_minutes <= (maxMinutes || 60) && 
          travel.workB.duration_minutes <= (maxMinutes || 60);

        results.push({ listing, travel, passes });
      } catch (err) {
        console.error(`Error calculating travel for ${listing.url}:`, err.message);
        // Include listing anyway with error status
        results.push({ 
          listing, 
          travel: { 
            workA: { status: 'ERROR', duration_minutes: null },
            workB: { status: 'ERROR', duration_minutes: null }
          }, 
          passes: false 
        });
      }
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: error.message });
  }
}

export const config = {
  maxDuration: 60, // 60 seconds for Vercel Pro, 10s for free tier
};
