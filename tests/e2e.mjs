import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.TEST_URL || 'http://localhost:5173';
const IMG_DIR = path.resolve('brand/raw/test-images');
const OUT_DIR = path.resolve('brand/raw/test-shots');
const DL_DIR = path.resolve('brand/raw/downloads');

fs.rmSync(DL_DIR, { recursive: true, force: true });
fs.mkdirSync(DL_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];
const log = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pickFile = async (page, file) => {
  const [c] = await Promise.all([page.waitForFileChooser(), page.click('[role="button"]')]);
  await c.accept([path.join(IMG_DIR, file)]);
};

const resetToUpload = async (page) => {
  if (await page.$('[data-testid="choose-different-photo"]')) {
    await page.click('[data-testid="choose-different-photo"]');
    await page.waitForSelector('[role="button"]', { timeout: 5000 });
  }
};

/** Exact rendering of the crop canvas — identical draws produce identical data URLs. */
const cropFingerprint = (page) =>
  page.evaluate(() => document.querySelector('[data-testid="crop-canvas"]').toDataURL());

const cropTransform = (page) =>
  page.$eval('[data-testid="crop-canvas"]', (c) => c.dataset.transform);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });

try {
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  const client = await page.createCDPSession();
  await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL_DIR });

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: 'networkidle0' });

  // ---------- Upload + crop engine ----------
  for (const f of ['landscape.jpg', 'portrait.jpg', 'square.jpg']) {
    await resetToUpload(page);
    await pickFile(page, f);
    await page.waitForSelector('[data-testid="crop-canvas"]', { timeout: 8000 });
    await sleep(250);
    const box = await page.$eval('[data-testid="crop-canvas"]', (c) => {
      const r = c.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    log(`${f} cover-fits the 4:5 slot without distortion`, box.w === 280 && box.h === 350, `${box.w}x${box.h}`);
  }

  // Drag actually repositions the image
  await resetToUpload(page);
  await pickFile(page, 'portrait.jpg');
  await page.waitForSelector('[data-testid="crop-canvas"]');
  await sleep(250);
  const cb = await page.$eval('[data-testid="crop-canvas"]', (c) => {
    const r = c.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  const beforeZoom = await cropFingerprint(page);
  await page.mouse.move(cb.x, cb.y);
  await page.mouse.wheel({ deltaY: -600 });
  await sleep(200);
  const afterZoom = await cropFingerprint(page);
  log('scroll-to-zoom changes the rendered crop', beforeZoom !== afterZoom);

  await page.mouse.move(cb.x, cb.y);
  await page.mouse.down();
  await page.mouse.move(cb.x - 120, cb.y - 90, { steps: 12 });
  await page.mouse.up();
  await sleep(200);
  const afterDrag = await cropFingerprint(page);
  log('drag-to-reposition changes the rendered crop', afterZoom !== afterDrag);

  await page.click('[data-testid="reset-zoom"]');
  await sleep(250);
  log('reset restores the default transform', (await cropTransform(page)) === '1.000,0.000,0.000', await cropTransform(page));
  log('reset restores the original auto-crop pixels', (await cropFingerprint(page)) === beforeZoom);

  // HEIC (exercises the lazily-loaded decoder chunk)
  await resetToUpload(page);
  await pickFile(page, 'photo.heic');
  const heicOk = await page
    .waitForSelector('[data-testid="crop-canvas"]', { timeout: 20000 })
    .then(() => true, () => false);
  log('HEIC converts client-side and renders', heicOk);

  // Error states
  await resetToUpload(page);
  await pickFile(page, 'notes.txt');
  await sleep(300);
  const e1 = await page.$eval('[role="alert"]', (e) => e.textContent).catch(() => null);
  log('unsupported file type shows a clear error', !!e1, e1 ?? 'none');

  await pickFile(page, 'huge.jpg');
  await sleep(300);
  const e2 = await page.$eval('[role="alert"]', (e) => e.textContent).catch(() => null);
  log('oversized file shows a clear error', !!e2 && /large/i.test(e2), e2 ?? 'none');

  // ---------- Full build -> result flow ----------
  await pickFile(page, 'portrait.jpg');
  await page.waitForSelector('[data-testid="crop-canvas"]', { timeout: 8000 });

  const disabledBefore = await page.$eval('[data-testid="generate-btn"]', (b) => b.disabled);
  log('generate is gated until name + stack are filled', disabledBefore === true);

  await page.type('#builder-name', 'Aarav Sharma');
  await page.type('#builder-role', 'AI/ML');
  await sleep(200);
  const title1 = await page.$eval('[data-testid="builder-title"]', (e) => e.textContent.trim());
  log('builder title generates from the stack', !!title1 && title1 !== '—', title1);

  let title2 = title1;
  for (let i = 0; i < 6 && title2 === title1; i++) {
    await page.click('[data-testid="reroll-title"]');
    await sleep(120);
    title2 = await page.$eval('[data-testid="builder-title"]', (e) => e.textContent.trim());
  }
  log('reroll yields a different title', title2 !== title1, `${title1} -> ${title2}`);

  const t0 = Date.now();
  await page.click('[data-testid="generate-btn"]');
  await page.waitForFunction(
    () => {
      const c = document.querySelector('[data-testid="card-canvas"]');
      return c && c.width === 1080 && c.height === 1350;
    },
    { timeout: 10000 },
  );
  const genMs = Date.now() - t0;
  log('card renders at 1080x1350', true, `${genMs}ms`);
  log('generation feels near-instant (<2s)', genMs < 2000, `${genMs}ms`);

  const paint = await page.evaluate(() => {
    const c = document.querySelector('[data-testid="card-canvas"]');
    const ctx = c.getContext('2d');
    const corner = ctx.getImageData(8, 8, 1, 1).data;
    const seen = new Set();
    for (let x = 20; x < 1080; x += 90)
      for (let y = 20; y < 1350; y += 90) {
        const p = ctx.getImageData(x, y, 1, 1).data;
        seen.add(`${p[0]},${p[1]},${p[2]}`);
      }
    const flat = ctx.getImageData(60, 700, 40, 40).data;
    let min = 255, max = 0;
    for (let i = 0; i < flat.length; i += 4) {
      min = Math.min(min, flat[i + 1]);
      max = Math.max(max, flat[i + 1]);
    }
    return { corner: [...corner].slice(0, 3), distinct: seen.size, grain: max - min };
  });
  const [r, g, b] = paint.corner;
  log('card background is brand green', Math.abs(r - 11) < 40 && Math.abs(g - 104) < 45 && Math.abs(b - 57) < 40, `rgb(${r},${g},${b})`);
  log('card has real composited content', paint.distinct > 20, `${paint.distinct} distinct colors`);
  log('riso grain is baked into the export', paint.grain > 8, `spread ${paint.grain}`);

  await page.screenshot({ path: path.join(OUT_DIR, 'result-mobile.png') });

  // Download
  await page.click('[data-testid="download-btn"]');
  let dl = null;
  for (let i = 0; i < 40 && !dl; i++) {
    const files = fs.readdirSync(DL_DIR).filter((f) => f.endsWith('.png'));
    if (files.length) dl = path.join(DL_DIR, files[0]);
    else await sleep(150);
  }
  if (dl) {
    const buf = fs.readFileSync(dl);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    log('download writes a real PNG', isPng, `${path.basename(dl)} ${(buf.length / 1024).toFixed(0)}KB`);
    log('downloaded PNG is 1080x1350', buf.readUInt32BE(16) === 1080 && buf.readUInt32BE(20) === 1350);
  } else log('download writes a real PNG', false, 'no file appeared');

  // Share fallback
  const intent = await page.evaluate(async () => {
    let captured = null;
    const o = window.open;
    window.open = (u) => ((captured = u), null);
    const cs = navigator.canShare;
    navigator.canShare = () => false;
    document.querySelector('[data-testid="share-btn"]').click();
    await new Promise((r) => setTimeout(r, 400));
    window.open = o;
    if (cs) navigator.canShare = cs;
    return captured;
  });
  const decoded = intent ? decodeURIComponent(intent) : '';
  log('Share to X opens the tweet intent', decoded.includes('twitter.com/intent/tweet'));
  log('caption pre-fills #FrameInGoa', decoded.includes('#FrameInGoa'));
  log('caption includes the builder name', decoded.includes('Aarav Sharma'));

  // ---------- Global guarantees ----------
  const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
  log('no login or signup gate anywhere', !/\b(log ?in|sign ?up|sign ?in|register|create account)\b/.test(bodyText));

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log('no horizontal scroll at 390px', overflow <= 0, `${overflow}px`);

  // Small-phone check (iPhone SE)
  await page.setViewport({ width: 320, height: 568, deviceScaleFactor: 2 });
  await sleep(400);
  const overflowSm = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log('no horizontal scroll at 320px', overflowSm <= 0, `${overflowSm}px`);
  await page.screenshot({ path: path.join(OUT_DIR, 'result-320.png') });

  // Desktop check
  await page.setViewport({ width: 1280, height: 900 });
  await sleep(400);
  await page.screenshot({ path: path.join(OUT_DIR, 'result-desktop.png') });
  const overflowLg = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  log('no horizontal scroll at 1280px', overflowLg <= 0, `${overflowLg}px`);

  log('no console errors during entire run', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
} finally {
  await browser.close();
}

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('FAILURES: ' + failed.map((f) => f.name).join(', '));
  process.exit(1);
}
