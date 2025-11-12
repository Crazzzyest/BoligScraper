// Quick script to inspect a FINN page and find correct selectors
const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Visit a known listing
  await page.goto('https://www.finn.no/realestate/homes/ad.html?finnkode=426090182', { waitUntil: 'domcontentloaded' });
  
  console.log('\n=== Inspecting FINN page ===\n');
  
  // Try various selectors for address
  const addressSelectors = [
    'address',
    '[class*="address"]',
    '[data-testid*="address"]',
    '.panel .u-mb8',
    'p.u-caption',
    'dd'
  ];
  
  for (const sel of addressSelectors) {
    try {
      const text = await page.$eval(sel, el => el.innerText);
      console.log(`✓ ${sel}: "${text.substring(0, 50)}"`);
    } catch (e) {
      console.log(`✗ ${sel}: not found`);
    }
  }
  
  console.log('\n=== Looking for price ===\n');
  const priceSelectors = [
    '[class*="price"]',
    '[class*="Price"]',
    'dt:has-text("Prisantydning") + dd',
    'dt:has-text("Totalpris") + dd'
  ];
  
  for (const sel of priceSelectors) {
    try {
      const text = await page.$eval(sel, el => el.innerText);
      console.log(`✓ ${sel}: "${text}"`);
    } catch (e) {
      console.log(`✗ ${sel}: not found`);
    }
  }
  
  // Get all dd elements (definition list values)
  console.log('\n=== All <dd> elements (key-value pairs) ===\n');
  const dds = await page.$$eval('dd', els => els.map(el => el.innerText.substring(0, 60)));
  dds.forEach((text, i) => console.log(`dd[${i}]: ${text}`));
  
  await browser.close();
})();
