// Script to automate Safari with AppleScript (uses Safari's saved passwords)
const { execSync } = require('child_process');

function runAppleScript(script) {
  try {
    return execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, { encoding: 'utf-8' }).trim();
  } catch (e) {
    console.error('AppleScript error:', e.message);
    return null;
  }
}

function sleep(ms) {
  execSync(`sleep ${ms / 1000}`);
}

(async () => {
  console.log('Opening GoDaddy in Safari...');

  // Open Safari and navigate to GoDaddy products page
  runAppleScript(`
    tell application "Safari"
      activate
      if (count of windows) = 0 then
        make new document
      end if
      set URL of document 1 to "https://account.godaddy.com/products"
    end tell
  `);

  // Wait for page to load
  sleep(5000);

  // Check current URL to see if we need to log in
  let currentUrl = runAppleScript(`tell application "Safari" to return URL of document 1`);
  console.log('Current URL:', currentUrl);

  if (currentUrl && (currentUrl.includes('sso.godaddy.com') || currentUrl.includes('idp.godaddy.com'))) {
    console.log('Login page detected. Safari should auto-fill your saved credentials.');
    console.log('Waiting for login to complete...');

    // Wait for login (check every 3 seconds for up to 2 minutes)
    for (let i = 0; i < 40; i++) {
      sleep(3000);
      currentUrl = runAppleScript(`tell application "Safari" to return URL of document 1`);
      if (currentUrl && currentUrl.includes('account.godaddy.com')) {
        console.log('Login successful!');
        break;
      }
      if (i % 5 === 0) console.log('Still waiting for login...', currentUrl);
    }
  }

  sleep(3000);

  // Now navigate directly to email forwarding for camspam.com
  console.log('Navigating to email forwarding page...');
  runAppleScript(`
    tell application "Safari"
      set URL of document 1 to "https://dcc.godaddy.com/control/camspam.com/email/forwarding"
    end tell
  `);

  sleep(5000);

  // Take screenshot
  execSync('screencapture -x /tmp/safari-godaddy-email.png');
  console.log('Screenshot saved to /tmp/safari-godaddy-email.png');

  console.log('\\n=== Please check Safari ===');
  console.log('You should now be on the email forwarding page for camspam.com');
  console.log('Set up forwarding: support@camspam.com -> admin@palovisto.com');
})();
