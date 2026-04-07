const { chromium } = require('playwright');

(async () => {
  // Use persistent context - saves cookies/login between runs
  const userDataDir = '/Users/leonbrill/.playwright-godaddy-profile';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 300
  });

  const page = context.pages()[0] || await context.newPage();

  console.log('Opening GoDaddy...');
  await page.goto('https://account.godaddy.com/products');

  // Wait a moment to see if we're redirected to login
  await page.waitForTimeout(3000);

  // Check if we're on a login page
  const currentUrl = page.url();
  if (currentUrl.includes('sso.godaddy.com') || currentUrl.includes('login') || currentUrl.includes('signin')) {
    console.log('Login required. Please log in manually in the browser window...');
    console.log('Waiting for you to complete login...');

    // Wait until we're no longer on a login page
    await page.waitForFunction(() => {
      return !window.location.href.includes('sso.godaddy.com') &&
             !window.location.href.includes('login') &&
             !window.location.href.includes('signin');
    }, { timeout: 300000 }); // 5 minutes to log in

    console.log('Login detected! Continuing...');
    await page.waitForTimeout(3000);
  }

  // Wait for page to load
  await page.waitForLoadState('networkidle');
  console.log('Products page loaded');

  // Look for camspam domain and click it
  console.log('Looking for camspam domain...');
  await page.waitForSelector('text=camspam', { timeout: 30000 });
  await page.click('text=camspam');

  // Wait for domain settings page
  await page.waitForLoadState('networkidle');
  console.log('Clicked camspam, waiting for domain page...');

  // Look for DNS or Email section
  // GoDaddy's interface may have "Manage DNS" or "Email" options
  await page.waitForTimeout(2000);

  // Try to find Email Forwarding option
  const emailLink = await page.locator('text=/email/i').first();
  if (await emailLink.isVisible()) {
    console.log('Found email link, clicking...');
    await emailLink.click();
    await page.waitForLoadState('networkidle');
  }

  // Take a screenshot to see where we are
  await page.screenshot({ path: '/tmp/playwright-godaddy-1.png' });
  console.log('Screenshot saved to /tmp/playwright-godaddy-1.png');

  // Look for "Email Forwarding" or "Add Forwarding" or similar
  const forwardingLink = await page.locator('text=/forward/i').first();
  if (await forwardingLink.isVisible()) {
    console.log('Found forwarding link, clicking...');
    await forwardingLink.click();
    await page.waitForLoadState('networkidle');
  }

  await page.screenshot({ path: '/tmp/playwright-godaddy-2.png' });
  console.log('Screenshot saved to /tmp/playwright-godaddy-2.png');

  // Now we need to set up the forwarding
  // Look for input fields to add forwarding address
  // support@camspam.com -> admin@palovisto.com

  // Try to find "Add" or "Create" button for new forwarding
  const addButton = await page.locator('text=/add|create/i').first();
  if (await addButton.isVisible()) {
    console.log('Found add button, clicking...');
    await addButton.click();
    await page.waitForTimeout(1000);
  }

  // Fill in the forwarding details
  // Look for input fields
  const fromInput = await page.locator('input[placeholder*="from" i], input[name*="from" i], input[id*="from" i]').first();
  const toInput = await page.locator('input[placeholder*="to" i], input[name*="to" i], input[id*="forward" i]').first();

  if (await fromInput.isVisible()) {
    console.log('Filling "from" field with: support');
    await fromInput.fill('support');
  }

  if (await toInput.isVisible()) {
    console.log('Filling "to" field with: admin@palovisto.com');
    await toInput.fill('admin@palovisto.com');
  }

  await page.screenshot({ path: '/tmp/playwright-godaddy-3.png' });
  console.log('Screenshot saved to /tmp/playwright-godaddy-3.png');

  // Keep browser open so user can verify/complete manually if needed
  console.log('\n=== Browser will stay open for 60 seconds ===');
  console.log('Please verify the email forwarding setup in the browser.');
  console.log('Forward: support@camspam.com -> admin@palovisto.com');

  await page.waitForTimeout(60000);

  await context.close();
  console.log('Done!');
})();
