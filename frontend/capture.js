import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Login as alice (Customer)
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('#login-username', 'alice');
  await page.type('#login-password', 'password');
  await page.click('#btn-login-submit');

  // Wait for header and catalog cards to load
  await page.waitForSelector('#btn-cart-drawer', { timeout: 10000 });
  await page.waitForSelector('#btn-add-peony', { visible: true, timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // Add Peony to cart
  await page.click('#btn-add-peony');
  console.log('✓ Added Peony to cart');
  await new Promise(r => setTimeout(r, 600));

  // Open Cart Drawer
  await page.click('#btn-cart-drawer');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: '../docs/images/customer_cart.png' });
  console.log('✓ customer_cart.png');

  // Step 2: Click "Proceed to Delivery Details"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const nextBtn = btns.find(b => b.textContent.includes('Proceed to Delivery'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: '../docs/images/customer_checkout_delivery.png' });
  console.log('✓ customer_checkout_delivery.png');

  // Step 3: Click "Pay with PayMock (Razorpay)"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const payBtn = btns.find(b => b.textContent.includes('Pay with PayMock'));
    if (payBtn) payBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: '../docs/images/customer_paymock_gateway.png' });
  console.log('✓ customer_paymock_gateway.png');

  // Step 4: Submit PayMock Payment
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const submitPay = btns.find(b => b.textContent.includes('Pay ₹'));
    if (submitPay) submitPay.click();
  });
  await new Promise(r => setTimeout(r, 4500));
  await page.screenshot({ path: '../docs/images/customer_order_receipt.png' });
  console.log('✓ customer_order_receipt.png');

  await browser.close();
  console.log('All checkout & PayMock screenshots captured!');
})();
