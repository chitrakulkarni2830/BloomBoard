import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Customer places order as alice
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('#login-username', 'alice');
  await page.type('#login-password', 'password');
  await page.click('#btn-login-submit');

  await page.waitForSelector('#btn-cart-drawer', { timeout: 10000 });
  await page.waitForSelector('#btn-add-peony', { visible: true, timeout: 10000 });

  // Add Peony & proceed to checkout
  await page.click('#btn-add-peony');
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
  await new Promise(r => setTimeout(r, 1200));

  // Submit PayMock payment form
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitBtn = btns.find(b => b.textContent.includes('Pay') && b.textContent.includes('with PayMock'));
    if (submitBtn) submitBtn.click();
  });
  await new Promise(r => setTimeout(r, 3500)); // wait for PayMock verification

  // Close receipt
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const closeBtn = btns.find(b => b.textContent.includes('Continue Shopping'));
    if (closeBtn) closeBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Open My Orders
  await page.click('#btn-my-orders');
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 1: Customer Order Status Timeline & OTP Banner
  await page.screenshot({ path: '../docs/images/customer_order_timeline_otp.png' });
  console.log('✓ customer_order_timeline_otp.png');

  // 2. Open new tab / fresh session for Florist Admin session
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1440, height: 900 });
  await page2.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

  // Clear storage on second page to get clean login
  await page2.evaluate(() => localStorage.clear());
  await page2.reload({ waitUntil: 'networkidle0' });

  await page2.type('#login-username', 'admin');
  await page2.type('#login-password', 'password');
  await page2.click('#btn-login-submit');

  await page2.waitForSelector('#btn-tab-orders', { timeout: 10000 });
  await page2.click('#btn-tab-orders');
  await new Promise(r => setTimeout(r, 1500));

  // Screenshot 2: Florist Back-Office Orders Management Panel
  await page2.screenshot({ path: '../docs/images/florist_orders_management.png' });
  console.log('✓ florist_orders_management.png');

  // Florist clicks Accept Order ➔ Mark Packed ➔ Dispatch / Ship
  await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const acceptBtn = btns.find(b => b.textContent.includes('Accept Order'));
    if (acceptBtn) acceptBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const packBtn = btns.find(b => b.textContent.includes('Mark Packed'));
    if (packBtn) packBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const shipBtn = btns.find(b => b.textContent.includes('Dispatch / Ship'));
    if (shipBtn) shipBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // Click Verify Delivery OTP
  await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const verifyBtn = btns.find(b => b.textContent.includes('Verify Delivery OTP'));
    if (verifyBtn) verifyBtn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Screenshot 3: Florist Delivery OTP Verification Modal
  await page2.screenshot({ path: '../docs/images/florist_verify_otp_modal.png' });
  console.log('✓ florist_verify_otp_modal.png');

  await browser.close();
  console.log('All order workflow screenshots captured successfully!');
})();
