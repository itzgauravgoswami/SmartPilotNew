const UAParser = require('ua-parser-js');

/**
 * Extract device info from User-Agent header
 * @param {string} userAgent
 * @returns {{ deviceName, deviceType, browser, os }}
 */
function parseDevice(userAgent = '') {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  const browser = result.browser.name || 'Unknown Browser';
  const browserVersion = result.browser.major || '';
  const os = result.os.name || 'Unknown OS';
  const osVersion = result.os.version || '';
  const deviceVendor = result.device.vendor || '';
  const deviceModel = result.device.model || '';
  const deviceType = result.device.type; // 'mobile' | 'tablet' | undefined (desktop)

  let deviceName = '';
  if (deviceVendor && deviceModel) {
    deviceName = `${deviceVendor} ${deviceModel}`;
  } else {
    deviceName = `${os}${osVersion ? ' ' + osVersion : ''} — ${browser}${browserVersion ? ' ' + browserVersion : ''}`;
  }

  return {
    deviceName: deviceName.trim() || 'Unknown Device',
    deviceType: deviceType === 'mobile' ? 'mobile' : deviceType === 'tablet' ? 'tablet' : 'desktop',
    browser: `${browser}${browserVersion ? ' ' + browserVersion : ''}`.trim(),
    os: `${os}${osVersion ? ' ' + osVersion : ''}`.trim(),
  };
}

module.exports = { parseDevice };
