module.exports = {
  launch: {
    headless: process.env.CI === 'true',
    devtools: process.env.CI !== 'true',
    slowMo: process.env.CI !== 'true' ? 50 : 0,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
    ],
  },
  browserContext: 'default',
  server: {
    command: 'npm run dev',
    port: 3000,
    launchTimeout: 30000,
    debug: process.env.CI !== 'true',
  },
}