import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login as alice
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('#login-username', 'alice');
  await page.type('#login-password', 'password');
  await page.click('#btn-login-submit');

  await page.waitForSelector('#btn-cart-drawer', { timeout: 10000 });
  await page.waitForSelector('#btn-add-peony', { visible: true, timeout: 10000 });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 1: Storefront with Real Flower Photography Cards
  await page.screenshot({ path: '../docs/images/customer_real_flowers.png' });
  console.log('✓ customer_real_flowers.png');

  // Screenshot 2: Click "My Orders" button
  await page.click('#btn-my-orders');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '../docs/images/customer_my_orders.png' });
  console.log('✓ customer_my_orders.png');

  // Close My Orders modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent === 'Close');
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Add Peony to cart & Open Cart
  await page.click('#btn-add-peony');
  await new Promise(r => setTimeout(r, 600));
  await page.click('#btn-cart-drawer');
  await new Promise(r => setTimeout(r, 800));

  // Proceed to Delivery Details
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('Proceed to Delivery'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  // Click "📍 Detect Location"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const locBtn = btns.find(b => b.textContent.includes('Detect Now'));
    if (locBtn) locBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Screenshot 3: Delivery Form with Auto-Detected Location
  await page.screenshot({ path: '../docs/images/customer_location_detection.png' });
  console.log('✓ customer_location_detection.png');

  await browser.close();
  console.log('All new feature screenshots captured successfully!');
})();
