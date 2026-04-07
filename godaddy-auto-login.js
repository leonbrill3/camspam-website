const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to GoDaddy login
  console.log('Opening GoDaddy login page...');
  await page.goto('https://sso.godaddy.com/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Fill in credentials
  console.log('Entering username...');
  await page.fill('input[name="username"], input[id="username"], input[type="text"]', 'leonbrill');
  await page.waitForTimeout(500);

  console.log('Entering password...');
  await page.fill('input[name="password"], input[id="password"], input[type="password"]', 'vucTuw-3padko-vofviq');
  await page.waitForTimeout(500);

  // Click sign in button
  console.log('Clicking Sign In...');
  await page.waitForTimeout(1000);

  // Try multiple ways to click sign in
  try {
    await page.click('button:has-text("Sign In")');
  } catch (e) {
    console.log('First click method failed, trying alternative...');
    await page.locator('button').filter({ hasText: 'Sign In' }).click();
  }

  // Wait for login to complete
  console.log('Waiting for login to complete...');
  await page.waitForTimeout(8000);

  // Check if we're still on login page (might have 2FA or error)
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  if (currentUrl.includes('sso.godaddy.com') || currentUrl.includes('idp.godaddy.com')) {
    console.log('Still on login page - there might be 2FA or an error');
    await page.screenshot({ path: '/tmp/godaddy-login-result.png' });
    console.log('Screenshot saved. Please check if 2FA is required.');

    // Wait for user to complete any 2FA
    console.log('Waiting for any 2FA to be completed (60 seconds)...');
    await page.waitForFunction(() => {
      return !window.location.href.includes('sso.godaddy.com') &&
             !window.location.href.includes('idp.godaddy.com');
    }, { timeout: 60000 }).catch(() => {
      console.log('Timeout waiting for login completion');
    });
  }

  console.log('Navigating to DNS management...');
  await page.goto('https://dcc.godaddy.com/manage/camspam.com/dns');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/tmp/godaddy-dns-page.png' });
  console.log('Screenshot: /tmp/godaddy-dns-page.png');

  // Click on Forwarding tab
  console.log('Looking for Forwarding tab...');
  try {
    await page.click('text=Forwarding');
    console.log('Clicked Forwarding tab');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/tmp/godaddy-forwarding-tab.png' });
  } catch (e) {
    console.log('Could not find Forwarding tab');
  }

  // Look for email forwarding options
  console.log('Looking for email forwarding...');

  // Print all text content to help debug
  const pageText = await page.textContent('body');
  if (pageText.toLowerCase().includes('email')) {
    console.log('Page contains "email" text');
  }

  // Keep browser open
  console.log('\n========================================');
  console.log('Browser will stay open for 2 minutes.');
  console.log('Set up forwarding: support@camspam.com -> admin@palovisto.com');
  console.log('========================================\n');

  await page.waitForTimeout(120000);
  await browser.close();
})();
