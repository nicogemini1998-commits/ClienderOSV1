import puppeteer from 'puppeteer';

const DELAY_BETWEEN_CLICKS = 2500; // 2.5s between clicks
const DELAY_BETWEEN_SEARCHES = 5000; // 5s between searches
const DELAY_BETWEEN_CITIES = 30000; // 30s between city batches

async function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    query: 'constructor',
    city: 'Madrid',
    limit: 20,
    delayMs: DELAY_BETWEEN_CLICKS
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--query' && i + 1 < args.length) result.query = args[i + 1];
    if (args[i] === '--city' && i + 1 < args.length) result.city = args[i + 1];
    if (args[i] === '--limit' && i + 1 < args.length) result.limit = parseInt(args[i + 1]);
    if (args[i] === '--delay-ms' && i + 1 < args.length) result.delayMs = parseInt(args[i + 1]);
  }

  return result;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeBusinesses(page, limit) {
  const results = [];
  const seen = new Set();

  try {
    // Wait for results to load
    await page.waitForSelector('[data-item-id]', { timeout: 10000 }).catch(() => {});

    // Scroll through results to load more
    let previousHeight = 0;
    let attempts = 0;
    const maxAttempts = Math.ceil(limit / 3);

    while (results.length < limit && attempts < maxAttempts) {
      const items = await page.$$('[data-item-id]');

      for (let i = results.length; i < Math.min(items.length, limit); i++) {
        try {
          const item = items[i];

          // Get item ID for deduplication
          const itemId = await item.evaluate(el => el.getAttribute('data-item-id'));
          if (seen.has(itemId)) continue;
          seen.add(itemId);

          // Click to open details panel
          await item.click();
          await delay(DELAY_BETWEEN_CLICKS);

          // Extract data from details panel
          const business = await extractBusinessDetails(page);
          if (business && business.name) {
            results.push(business);

            // Output NDJSON line
            console.log(JSON.stringify(business));

            if (results.length >= limit) break;
          }

          // Close details panel
          try {
            const closeBtn = await page.$('[aria-label="Cerrar"]');
            if (closeBtn) {
              await closeBtn.click();
              await delay(DELAY_BETWEEN_CLICKS);
            }
          } catch (e) {
            // Ignore close errors
          }
        } catch (e) {
          // Continue to next result on extraction error
        }
      }

      // Scroll for more results
      const currentHeight = await page.evaluate(() => document.querySelector('[role="feed"]')?.scrollHeight || 0);
      if (currentHeight === previousHeight) break;

      previousHeight = currentHeight;
      await page.evaluate(() => {
        const feed = document.querySelector('[role="feed"]');
        if (feed) feed.scrollTop = feed.scrollHeight;
      });

      await delay(DELAY_BETWEEN_CLICKS);
      attempts++;
    }
  } catch (e) {
    console.error(`Scraping error: ${e.message}`, { stderr: true });
  }

  return results;
}

async function extractBusinessDetails(page) {
  try {
    const business = await page.evaluate(() => {
      const data = {};

      // Name
      const nameEl = document.querySelector('h1, [role="heading"]');
      data.name = nameEl?.textContent?.trim() || null;

      // Phone (search for phone pattern)
      const pageText = document.body.innerText;
      const phoneMatch = pageText.match(/(\+\d{1,3}[\s.-]?)?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/);
      data.phone = phoneMatch ? phoneMatch[0] : null;

      // Website (look for links)
      const websiteEl = Array.from(document.querySelectorAll('a')).find(a =>
        a.href && (a.href.includes('http') || a.href.includes('www')) && !a.href.includes('google')
      );
      data.website = websiteEl?.href || null;

      // Rating (look for star rating)
      const ratingEl = document.querySelector('[role="img"][aria-label*="★"]');
      if (ratingEl) {
        const match = ratingEl.getAttribute('aria-label')?.match(/\d+\.?\d*/);
        data.rating = match ? parseFloat(match[0]) : null;
      } else {
        data.rating = null;
      }

      // Reviews count
      const reviewsEl = Array.from(document.querySelectorAll('span')).find(el =>
        el.textContent.match(/\(\d+\s*reseña/)
      );
      if (reviewsEl) {
        const match = reviewsEl.textContent.match(/\((\d+)/);
        data.reviews_count = match ? parseInt(match[1]) : 0;
      } else {
        data.reviews_count = 0;
      }

      // Category (from business type info)
      const categoryEl = Array.from(document.querySelectorAll('span')).find(el =>
        el.textContent && !el.textContent.includes('(') && el.textContent.length < 50
      );
      data.category = categoryEl?.textContent?.trim() || null;

      // Address
      const addressEl = Array.from(document.querySelectorAll('span')).find(el =>
        el.textContent?.includes('Calle') ||
        el.textContent?.includes('Av.') ||
        el.textContent?.includes('Pl.')
      );
      data.address = addressEl?.textContent?.trim() || null;

      return data;
    });

    return business;
  } catch (e) {
    return null;
  }
}

async function main() {
  const args = await parseArgs();
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    // Navigate to Google Maps
    const searchQuery = `${args.query} en ${args.city}`;
    const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`;

    await page.goto(mapsUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(DELAY_BETWEEN_SEARCHES);

    // Scrape businesses
    await scrapeBusinesses(page, args.limit);

    await page.close();
  } catch (e) {
    console.error(`Fatal error: ${e.message}`, { stderr: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
