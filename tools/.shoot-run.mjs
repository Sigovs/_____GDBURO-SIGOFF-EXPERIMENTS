
import { chromium } from 'playwright';

const jobs = [{"slug":"v01-level-line","url":"https://sigovs.github.io/gd_buro_tests/v01-level-line/","scroll":0.82}];

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

for (const job of jobs) {
  try {
    process.stdout.write('  ' + job.slug.padEnd(22));
    await page.goto(job.url, { waitUntil: 'load', timeout: 45000 });

    // Wait for the scene to have painted. A canvas that is still one flat colour
    // is a scene that has not arrived, and it is the thing a naive shot catches.
    await page.waitForFunction(() => {
      const c = document.querySelector('canvas#scene');
      if (!c || !c.width) return false;
      const g = c.getContext('webgl2') || c.getContext('webgl');
      if (!g) return false;
      const px = new Uint8Array(4 * 64);
      g.readPixels(c.width / 2 - 8, c.height / 2 - 8, 8, 8, g.RGBA, g.UNSIGNED_BYTE, px);
      let min = 255, max = 0;
      for (let i = 0; i < px.length; i += 4) {
        for (let k = 0; k < 3; k++) { min = Math.min(min, px[i+k]); max = Math.max(max, px[i+k]); }
      }
      return max - min > 6;   // something other than a flat field
    }, null, { timeout: 30000 }).catch(() => process.stdout.write('[canvas timeout] '));

    // Scroll to the frame worth showing, then let the damped camera settle.
    await page.evaluate((f) => {
      const h = document.body.scrollHeight - window.innerHeight;
      window.scrollTo({ top: h * f, behavior: 'instant' });
    }, job.scroll);
    await page.waitForTimeout(2600);

    await page.screenshot({ path: 'previews/' + job.slug + '.jpg', type: 'jpeg', quality: 82 });
    process.stdout.write('ok\n');
  } catch (e) {
    process.stdout.write('FAILED — ' + e.message.split('\n')[0] + '\n');
  }
}

await browser.close();
