const { chromium } = require('playwright');

(async () => {
  const userDataDir = '/Users/leonbrill/.playwright-godaddy-profile';

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    slowMo: 200,
    viewport: { width: 1280, height: 900 }
  });

  const page = context.pages()[0] || await context.newPage();

  // Go directly to the DNS management page for camspam.com
  console.log('Navigating to camspam.com DNS management...');
  await page.goto('https://dcc.godaddy.com/manage/camspam.com/dns');

  await page.waitForTimeout(3000);

  // Check if we're on login page
  if (page.url().includes('sso.godaddy.com') || page.url().includes('idp.godaddy.com')) {
    console.log('\n========================================');
    console.log('LOGIN REQUIRED!');
    console.log('Please log in to GoDaddy in the browser window.');
    console.log('The script will continue automatically after login.');
    console.log('========================================\n');

    // Wait for navigation away from login page
    await page.waitForFunction(() => {
      return !window.location.href.includes('sso.godaddy.com') &&
             !window.location.href.includes('idp.godaddy.com');
    }, { timeout: 300000 });

    console.log('Login successful! Continuing...');
    await page.waitForTimeout(2000);

    // Navigate to DNS page again after login
    await page.goto('https://dcc.godaddy.com/manage/camspam.com/dns');
    await page.waitForTimeout(3000);
  }

  // Now we should be on DNS Management page
  // Click the "Forwarding" tab
  console.log('Looking for Forwarding tab...');

  try {
    // Wait for and click the Forwarding tab
    await page.waitForSelector('text=Forwarding', { timeout: 10000 });
    await page.click('text=Forwarding');
    console.log('Clicked Forwarding tab');
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Could not find Forwarding tab, taking screenshot...');
  }

  await page.screenshot({ path: '/tmp/playwright-forward-1.png' });
  console.log('Screenshot: /tmp/playwright-forward-1.png');

  // Look for "Email Forwarding" section or similar
  const emailForwardingVisible = await page.locator('text=/email.*forward/i').first().isVisible().catch(() => false);

  if (emailForwardingVisible) {
    console.log('Found Email Forwarding section!');
    await page.click('text=/email.*forward/i');
    await page.waitForTimeout(2000);
  }

  // Look for Add/Create button
  const addBtnVisible = await page.locator('button:has-text("Add"), button:has-text("Create"), a:has-text("Add")').first().isVisible().catch(() => false);

  if (addBtnVisible) {
    console.log('Found Add button, clicking...');
    await page.click('button:has-text("Add"), button:has-text("Create"), a:has-text("Add")');
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: '/tmp/playwright-forward-2.png' });
  console.log('Screenshot: /tmp/playwright-forward-2.png');

  // Try to fill in forwarding details
  // Look for email input fields
  const inputs = await page.locator('input[type="text"], input[type="email"]').all();
  console.log(`Found ${inputs.length} input fields`);

  // Keep browser open for manual completion
  console.log('\n========================================');
  console.log('Browser will stay open for 2 minutes.');
  console.log('Please set up email forwarding manually if needed:');
  console.log('  FROM: support@camspam.com');
  console.log('  TO: admin@palovisto.com');
  console.log('========================================\n');

  await page.waitForTimeout(120000);
  await context.close();
})();
