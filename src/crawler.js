'use strict';
const playwright = require('playwright');
const PL_HEADLESS = process.env.PLAYWRIGHT_HEADLESS !== 'false';

async function scrapeFinnSearch(url, options = {}) {
  const max = options.max || 20;
  const browser = await playwright.chromium.launch({ headless: PL_HEADLESS });
  const context = await browser.newContext();
  const page = await context.newPage();

  const listingLinks = [];

  // Scrape multiple pages (up to 3 pages to cover ~150 listings)
  for (let pageNum = 1; pageNum <= 3; pageNum++) {
    const pageUrl = pageNum === 1 ? url : `${url}${url.includes('?') ? '&' : '?'}page=${pageNum}`;
    
    console.log(`Crawling page ${pageNum}: ${pageUrl}`);
    await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Collect listing links - all property-related links
    const anchors = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText })));
    
    const beforeCount = listingLinks.length;
    for (const a of anchors) {
      if (!a.href) continue;
      // Match all types of property listings:
      // - Regular ads: /realestate/homes/ad.html?finnkode=
      // - New builds/projects: /realestate/newbuildings/
      // - Other property URLs under /realestate/homes/
      if (
        a.href.includes('/realestate/homes/ad.html?finnkode=') ||
        a.href.includes('/realestate/newbuildings/') ||
        (a.href.includes('/realestate/homes/') && a.href.includes('finnkode='))
      ) {
        if (!listingLinks.includes(a.href)) listingLinks.push(a.href);
      }
    }
    
    // Stop if no new listings found on this page
    if (listingLinks.length === beforeCount) {
      console.log(`No new listings on page ${pageNum}, stopping crawl`);
      break;
    }
  }

  console.log(`Found ${listingLinks.length} unique listings across pages`);

  const results = [];
  // Process up to max listings
  for (let link of listingLinks.slice(0, max)) {
    try {
      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Extract finnkode from URL
      const finnkode = link.match(/finnkode=(\d+)/)?.[1] || '';
      
      // Extract title (h1)
      const title = await page.$eval('h1', el => el.innerText).catch(() => 'Ukjent tittel');
      
      const details = await page.evaluate(() => {
        const result = { price: null, address: null, lat: null, lng: null };
        
        // Look for definition list items
        const dts = Array.from(document.querySelectorAll('dt'));
        for (const dt of dts) {
          const label = dt.innerText.toLowerCase();
          const dd = dt.nextElementSibling;
          if (!dd || dd.tagName !== 'DD') continue;
          
          if (label.includes('pris') || label.includes('totalpris')) {
            result.price = dd.innerText.trim();
          }
          if (label.includes('adresse') || label.includes('beliggenhet')) {
            result.address = dd.innerText.trim();
          }
        }
        
        // Try to extract address from page title or meta tags
        if (!result.address) {
          const metaAddr = document.querySelector('meta[property="og:street-address"]');
          if (metaAddr) result.address = metaAddr.content;
        }
        
        // Look for coordinates in window/global JavaScript objects
        if (window.__NEXT_DATA__ && window.__NEXT_DATA__.props) {
          try {
            const pageProps = window.__NEXT_DATA__.props.pageProps || window.__NEXT_DATA__.props;
            if (pageProps.initialState && pageProps.initialState.ad) {
              const ad = pageProps.initialState.ad;
              if (ad.coordinates) {
                result.lat = ad.coordinates.lat || ad.coordinates.latitude;
                result.lng = ad.coordinates.lon || ad.coordinates.lng || ad.coordinates.longitude;
              }
              if (ad.location && !result.address) {
                result.address = ad.location;
              }
            }
          } catch (e) {}
        }
        
        // Look for coordinates in inline script tags with window.INITIAL_STATE or similar
        const scripts = Array.from(document.querySelectorAll('script:not([src])'));
        for (const script of scripts) {
          const text = script.textContent;
          
          // Match various coordinate patterns
          if (text.includes('lat') && text.includes('lng') || text.includes('lon')) {
            // Try pattern: "lat":63.123,"lng":10.456 or similar
            const coordMatch = text.match(/["']?lat(?:itude)?["']?\s*:\s*(-?\d+\.?\d*)[,\s}]+["']?l(?:ng|on)(?:gitude)?["']?\s*:\s*(-?\d+\.?\d*)/i);
            if (coordMatch) {
              result.lat = parseFloat(coordMatch[1]);
              result.lng = parseFloat(coordMatch[2]);
              break;
            }
          }
        }
        
        return result;
      });

      const price = details.price || 'Pris ikke oppgitt';
      
      // Use coordinates if found
      let address = details.address;
      let coordinates = null;
      
      if (details.lat && details.lng) {
        coordinates = { lat: details.lat, lng: details.lng };
        address = `${details.lat},${details.lng}`; // Use coordinates directly for Google Distance Matrix
      }
      
      // Final fallback to title if still no address
      if (!address) {
        address = title;
      }

      results.push({ 
        title: title, 
        price: price, 
        address: address,
        coordinates: coordinates,
        url: link 
      });
    } catch (e) {
      console.warn('Failed to scrape', link, e.message);
    }
  }

  await browser.close();
  return results;
}

module.exports = { scrapeFinnSearch, crawlFinn: scrapeFinnSearch };
