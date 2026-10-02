import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const URL = process.env.SITE_URL || 'http://localhost:8765/';
let browser;
before(async () => { browser = await chromium.launch({ channel: 'chrome' }); });
after(async () => { await browser.close(); });

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 1440, height: 900 },
    reducedMotion: opts.reducedMotion || 'no-preference', colorScheme: 'dark' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|net::ERR/.test(m.text())) errors.push(m.text()); });
  if (opts.blockGsap) await page.route('**/js/lib/**', r => r.abort());
  if (opts.theme) await page.addInitScript(t => localStorage.setItem('eh-theme', t), opts.theme);
  await page.goto(URL + (opts.hash || ''), { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  return { page, ctx, errors };
}
const inFold = (page, sel) => page.$eval(sel, el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; });

test('identity and proof are above the fold at 1440x900', async () => {
  const { page, ctx, errors } = await open();
  for (const sel of ['#hero .hero-name', '#hero .hero-role', '.tile-paper', '.tile-edu', '.tile-xp'])
    assert.ok(await inFold(page, sel), `${sel} not in first viewport`);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('facts: title, open source status, no phone, no em dash', async () => {
  const { page, ctx } = await open();
  const title = await page.title();
  assert.match(title, /AI Engineer/); assert.doesNotMatch(title, /Data Scientist/);
  const text = await page.evaluate(() => document.body.innerText + document.head.innerHTML + document.body.innerHTML);
  assert.ok(!text.includes('—'), 'em dash found');
  assert.doesNotMatch(text, /\+?44\s?7\d{3}/, 'phone number found');
  const nemo = await page.$$eval('.oss-row', rows => rows.filter(r => /NeMo/.test(r.innerText)).map(r => r.innerText));
  assert.ok(nemo.length && nemo.every(t => /In review/i.test(t)), 'NeMo must be In review');
  const merged = await page.$$eval('.oss-row .status-merged', els => els.length);
  assert.equal(merged, 4);
  assert.match(text, /linkedin\.com\/in\/eoin-houstoun-b0322b231/);
  await ctx.close();
});

test('noHorizontalScroll + projectsWithinTwoScreens at 390px', async () => {
  const { page, ctx } = await open({ viewport: { width: 390, height: 844 } });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  assert.ok(overflow <= 0, `horizontal overflow ${overflow}px`);
  const top = await page.$eval('#projects .project-card', el => el.getBoundingClientRect().top + scrollY);
  assert.ok(top < 2 * 844 + 400, `first project at ${top}px`);
  await ctx.close();
});

test('reducedMotionShowsFinalValues', async () => {
  const { page, ctx } = await open({ reducedMotion: 'reduce' });
  const vals = await page.$$eval('[data-count]', els => els.map(e => [e.textContent.trim(), e.dataset.final]));
  assert.ok(vals.length >= 1, `only ${vals.length} counters`);
  for (const [shown, final] of vals) assert.equal(shown, final);
  await ctx.close();
});

test('noHiddenContentWithoutGsap', async () => {
  const { page, ctx } = await open({ blockGsap: true });
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } });
  const hidden = await page.$$eval('main *, #hero *, #rail *', els => els.filter(e => {
    const s = getComputedStyle(e); return e.innerText?.trim() && s.opacity === '0'; }).map(e => e.className));
  assert.deepEqual(hidden, []);
  await ctx.close();
});

test('lightThemeContrast', async () => {
  const { page, ctx } = await open({ theme: 'light' });
  const bad = await page.$$eval('p, li, .chip, .tile *', els => els.filter(e => {
    if (e.closest('.on-dark') || !e.innerText?.trim()) return false;
    const c = getComputedStyle(e).color.match(/\d+/g).map(Number);
    return (c[0] + c[1] + c[2]) / 3 > 150; }).map(e => e.className || e.tagName).slice(0, 5));
  assert.deepEqual(bad, [], 'light-grey text on light theme');
  await ctx.close();
});

test('keyboardFilters', async () => {
  const { page, ctx } = await open();
  const chip = page.locator('.filter-chip[data-filter="sports"]');
  await chip.focus({ timeout: 5000 }); await page.keyboard.press('Enter');
  assert.equal(await chip.getAttribute('aria-pressed'), 'true');
  const visible = await page.$$eval('#projects .project-card', els => els.filter(e => !e.hidden && e.offsetParent).map(e => e.dataset.cat));
  assert.ok(visible.length > 0 && visible.every(c => c.split(' ').includes('sports')), JSON.stringify(visible));
  await ctx.close();
});

test('hashLinkLandsOnSection', async () => {
  for (const hash of ['#contact', '#experience']) {
    const { page, ctx } = await open({ hash });
    const [top, atBottom] = await page.$eval(hash, el => [el.getBoundingClientRect().top,
      Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2]);
    // Target at the top of the screen, or (for the last section) page scrolled fully down with it in view
    assert.ok((top >= 0 && top < 200) || (atBottom && top >= 0 && top < 900), `${hash} top at ${top}px`);
    const op = await page.$eval(hash + ' .contact-card, ' + hash + ' .xp-row', el => getComputedStyle(el).opacity);
    assert.equal(op, '1', `${hash} content invisible`);
    await ctx.close();
  }
});

test('phoneHeroLogosAllVisible', async () => {
  const { page, ctx } = await open({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const clipped = await page.$$eval('#hero .plate', ps => ps.map(p => p.getBoundingClientRect()).filter(r => r.left < 0 || r.right > innerWidth || r.width === 0).length);
  assert.equal(clipped, 0, `${clipped} hero logos clipped`);
  await ctx.close();
});

test('lightThemeSmallAccentTextMeetsAA', async () => {
  const { page, ctx } = await open({ theme: 'light' });
  const fails = await page.$$eval('.hl, .tag-amber, .oss-stars, .status-merged, .status-review, .chip b, .metric', els => {
    const lum = c => { const [r, g, b] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    return els.filter(e => e.offsetParent && !e.closest('.on-dark')).map(e => {
      const L1 = lum(getComputedStyle(e).color), L2 = lum('rgb(255,255,255)');
      return [e.className, ((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)).toFixed(2)];
    }).filter(([, r]) => r < 4.5);
  });
  assert.deepEqual(fails, []);
  await ctx.close();
});

test('front page: no betting tile, no CV download, work experience at a glance', async () => {
  const { page, ctx } = await open();
  assert.equal(await page.$$eval('#hero .tile-sport', e => e.length), 0, 'sports money tile still in hero');
  const heroText = await page.$eval('#hero', e => e.innerText);
  assert.doesNotMatch(heroText, /£/, 'money figure in hero');
  assert.match(heroText, /87%/, 'MSc 87% average not in hero');
  for (const org of ['TurinTech', 'Goldsmiths', 'AB InBev']) assert.match(await page.$eval('.tile-xp', e => e.innerText), new RegExp(org));
  const xp = await page.$eval('.tile-xp', e => e.innerText);
  for (const d of ['Feb 2026', 'Present', 'Jan 2025', 'Dec 2025', 'Mar 2023', 'Sep 2023']) assert.ok(xp.includes(d), `experience tile missing ${d}`);
  const cv = await page.$$eval('a', as => as.filter(a => /\.pdf$/i.test(a.getAttribute('href') || '') && /CV|curriculum/i.test(a.href + a.innerText)).length);
  assert.equal(cv, 0, 'CV download link present');
  assert.equal(await page.$$eval('a', as => as.filter(a => /Download CV|^CV$/.test(a.innerText.trim())).length), 0);
  await ctx.close();
});

test('TurinTech section sells Eoin: evoML, onboarding, people skills', async () => {
  const { page, ctx } = await open();
  const tt = await page.$eval('#turintech', e => e.innerText);
  assert.match(tt, /evoML/); assert.match(tt, /onboard/i);
  assert.equal(await page.$$eval('#turintech .metric-grid', e => e.length), 0, 'sales metric grid still present');
  const people = await page.$eval('#people', e => e.innerText);
  for (const w of [/client/i, /captain/i, /present/i, /trained/i]) assert.match(people, w);
  await ctx.close();
});

test('case studies: card links open pages with rendered charts, a way back and no em dash', async () => {
  const { page, ctx } = await open();
  const links = await page.$$eval('#projects a[href^="case-studies/"]', as => as.map(a => a.getAttribute('href')));
  assert.deepEqual([...new Set(links)].sort(), ['case-studies/bayes-vs-market.html', 'case-studies/manager-sacking.html']);
  for (const href of links) {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const p = await ctx.newPage();
      await p.setViewportSize(viewport);
      const errors = [];
      p.on('pageerror', e => errors.push(e.message));
      await p.goto(URL + href, { waitUntil: 'load' });
      const charts = await p.$$eval('svg.ch', svgs => svgs.map(s => s.childElementCount));
      assert.ok(charts.length >= 3 && charts.every(n => n > 5), `${href}: charts not rendered`);
      assert.equal(await p.$eval('.back a', a => a.getAttribute('href')), '../index.html#projects');
      const text = await p.evaluate(() => document.documentElement.outerHTML);
      assert.ok(!text.includes('—'), `${href}: em dash found`);
      assert.ok(!/draft for review/i.test(await p.evaluate(() => document.body.innerText)), `${href}: draft label left in`);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `${href}: page scrolls sideways at ${viewport.width}px`);
      assert.deepEqual(errors, [], `${href}: page errors`);
      await p.close();
    }
  }
  await ctx.close();
});
