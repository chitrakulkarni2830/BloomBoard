import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('#login-username', 'alice');
  await page.type('#login-password', 'password');
  await page.click('#btn-login-submit');

  await page.waitForSelector('#btn-cart-drawer', { timeout: 10000 });
  await page.waitForSelector('#btn-add-rose', { visible: true, timeout: 10000 });

  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '../docs/images/pune_market_flower_catalog.png' });
  console.log('✓ pune_market_flower_catalog.png');

  await browser.close();
})();
