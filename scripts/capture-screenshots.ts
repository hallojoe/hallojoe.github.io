import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { getPortfolioData } from '../src/lib/github';

const screenshotDir = resolve('public/screenshots');
const { projects } = await getPortfolioData();
const eligible = projects.filter((project) => project.pagesUrl);
console.log('Found ' + eligible.length + ' selected repositories with GitHub Pages.');

await rm(screenshotDir, { recursive: true, force: true });
await mkdir(screenshotDir, { recursive: true });

if (eligible.length === 0) {
  console.log('No live demos to screenshot.');
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });
let successCount = 0;

try {
  const context = await browser.newContext({
    viewport: { width: 1024, height: 768 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
  });

  for (const project of eligible) {
    const page = await context.newPage();
    // Repository names cannot include slashes, but sanitize defensively.
    const safeName = project.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const file = join(screenshotDir, safeName + '.png');

    try {
      const url = new URL(project.pagesUrl!);
      if (url.protocol !== 'https:') throw new Error('Only HTTPS demo URLs are supported');

      console.log('Capturing ' + project.name + ': ' + url.toString());
      const response = await page.goto(url.toString(), {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
      });

      if (!response || response.status() >= 400) {
        throw new Error('Demo returned HTTP ' + (response?.status() ?? 'unknown'));
      }

      // Give fonts and JS-rendered apps (including 3D/canvas demos) a moment to paint.
      await page.waitForLoadState('load', { timeout: 12_000 }).catch(() => {});
      await page.waitForTimeout(1_800);
      await page.screenshot({
        path: file,
        fullPage: false,
        animations: 'disabled',
        type: 'png',
        timeout: 15_000,
      });
      successCount++;
      console.log('Saved landscape tablet screenshot: ' + file);
    } catch (error) {
      // One down demo must not break the portfolio deployment.
      console.warn('Skipping screenshot for ' + project.name + ':', error);
    } finally {
      await page.close();
    }
  }

  await context.close();
} finally {
  await browser.close();
}

console.log('Captured ' + successCount + '/' + eligible.length + ' landscape tablet screenshots (1024 × 768).');
