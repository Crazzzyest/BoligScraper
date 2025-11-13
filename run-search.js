#!/usr/bin/env node
'use strict';

// CLI script for running property search without UI
const crawler = require('./src/crawler');
const distance = require('./src/distance');
const db = require('./src/db');
const sheets = require('./src/sheets');

async function runSearch() {
  console.log('Starting property search...');
  
  // Search parameters
  const params = {
    finnUrl: process.env.FINN_URL || 'https://www.finn.no/realestate/homes/search.html?filters=&location=0.20003&location=0.20061&min_bedrooms=3&property_type=1&q=landlig',
    workA: process.env.WORK_A || 'Kirkeveien 166, 0450 Oslo, Norway',
    workB: process.env.WORK_B || 'Kjeller Vest 8, 2007 Kjeller, Norway',
    maxMinutes: parseInt(process.env.MAX_MINUTES || '50', 10)
  };

  console.log('Search parameters:', params);

  try {
    // Initialize database
    await db.initDb();

    // Crawl FINN.no
    console.log('Crawling FINN.no...');
    const listings = await crawler.crawlFinn(params.finnUrl);
    console.log(`Found ${listings.length} listings`);

    if (listings.length === 0) {
      console.log('No listings found. Exiting.');
      return;
    }

    // Calculate travel times
    const results = [];
    for (const listing of listings) {
      console.log(`Processing: ${listing.title}`);

      // Check cache first
      let cached = await db.getCachedListing(listing.url);
      let travel;

      if (cached) {
        console.log('  Using cached travel times');
        travel = {
          workA: { duration_minutes: cached.workA_minutes },
          workB: { duration_minutes: cached.workB_minutes }
        };
      } else {
        console.log('  Calculating travel times...');
        travel = await distance.getTravelTimes(
          listing.address || listing.title,
          params.workA,
          params.workB
        );

        // Save to cache
        await db.saveListing({
          url: listing.url,
          title: listing.title,
          price: listing.price,
          address: listing.address,
          workA_minutes: travel.workA.duration_minutes,
          workB_minutes: travel.workB.duration_minutes
        });
      }

      const passes = (travel.workA.duration_minutes <= params.maxMinutes) && 
                     (travel.workB.duration_minutes <= params.maxMinutes);
      
      console.log(`  Work A: ${travel.workA.duration_minutes} min, Work B: ${travel.workB.duration_minutes} min - ${passes ? 'PASS' : 'FAIL'}`);
      
      results.push({ listing, travel, passes });
    }

    // Summary
    const passedCount = results.filter(r => r.passes).length;
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total listings: ${results.length}`);
    console.log(`Passed filter: ${passedCount}`);
    console.log(`Failed filter: ${results.length - passedCount}`);

    // Export to Google Sheets
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE) {
      console.log('\nExporting to Google Sheets...');
      const success = await sheets.appendResultsToSheet(results, params);
      if (success) {
        console.log('Successfully exported to Google Sheets');
      } else {
        console.error('Failed to export to Google Sheets');
        process.exit(1);
      }
    } else {
      console.log('\nSkipping Google Sheets export (no credentials configured)');
    }

    console.log('\nSearch completed successfully!');
  } catch (error) {
    console.error('Error during search:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSearch();
}

module.exports = { runSearch };
