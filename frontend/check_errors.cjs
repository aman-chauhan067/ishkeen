const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });
  
  page.on('pageerror', exception => {
    errors.push(`Uncaught Exception: ${exception}`);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
  } catch (e) {
    errors.push(`Navigation Error: ${e.message}`);
  }
  
  console.log("=== BROWSER ERRORS ===");
  if (errors.length > 0) {
    errors.forEach(e => console.log(e));
  } else {
    console.log("No console errors found.");
  }
  
  await browser.close();
})();
