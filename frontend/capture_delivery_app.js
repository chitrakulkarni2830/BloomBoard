import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  
  // 1. Customer places an order as alice
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('#login-username', 'alice');
  await page.type('#login-password', 'password');
  await page.click('#btn-login-submit');

  await page.waitForSelector('#btn-cart-drawer', { timeout: 10000 });
  await page.waitForSelector('#btn-add-rose', { visible: true, timeout: 10000 });

  await page.click('#btn-add-rose');
  await new Promise(r => setTimeout(r, 600));
  await page.click('#btn-cart-drawer');
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('Proceed to Delivery'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const paymockBtn = btns.find(b => b.textContent.includes('Pay with PayMock'));
    if (paymockBtn) paymockBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent.includes('Pay') && b.textContent.includes('with PayMock'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('Continue Shopping'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 2. Florist Admin dispatches order to SHIPPED status
  const pageAdmin = await browser.newPage();
  await pageAdmin.setViewport({ width: 1440, height: 900 });
  await pageAdmin.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await pageAdmin.evaluate(() => localStorage.clear());
  await pageAdmin.reload({ waitUntil: 'networkidle0' });

  await pageAdmin.type('#login-username', 'admin');
  await pageAdmin.type('#login-password', 'password');
  await pageAdmin.click('#btn-login-submit');

  await pageAdmin.waitForSelector('#btn-tab-orders', { timeout: 10000 });
  await pageAdmin.click('#btn-tab-orders');
  await new Promise(r => setTimeout(r, 1500));

  // Accept ➔ Pack ➔ Ship
  await pageAdmin.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const acceptBtn = btns.find(b => b.textContent.includes('Accept Order'));
    if (acceptBtn) acceptBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await pageAdmin.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const packBtn = btns.find(b => b.textContent.includes('Mark Packed'));
    if (packBtn) packBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  await pageAdmin.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const shipBtn = btns.find(b => b.textContent.includes('Dispatch / Ship'));
    if (shipBtn) shipBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 3. Login as Delivery Agent: rider / password
  const pageRider = await browser.newPage();
  await pageRider.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true }); // Mobile viewport for delivery rider app!
  await pageRider.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await pageRider.evaluate(() => localStorage.clear());
  await pageRider.reload({ waitUntil: 'networkidle0' });

  await pageRider.type('#login-username', 'rider');
  await pageRider.type('#login-password', 'password');
  await pageRider.click('#btn-login-submit');
  await new Promise(r => setTimeout(r, 2000));

  // Screenshot 1: Delivery Agent Fleet Mobile App
  await pageRider.screenshot({ path: '../docs/images/delivery_agent_fleet_app.png' });
  console.log('✓ delivery_agent_fleet_app.png');

  // Rider triggers Doorstep OTP
  await pageRider.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const arrBtn = btns.find(b => b.textContent.includes('Arrived at Customer Doorstep'));
    if (arrBtn) arrBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 2: Delivery Agent App after Doorstep Arrival
  await pageRider.screenshot({ path: '../docs/images/delivery_agent_doorstep_triggered.png' });
  console.log('✓ delivery_agent_doorstep_triggered.png');

  await browser.close();
  console.log('Delivery Agent UI screenshots captured successfully!');
})();
