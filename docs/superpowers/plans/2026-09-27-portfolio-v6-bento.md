# Portfolio v6 (Bento Hero + Side Rail) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the single-page portfolio so identity, employers, degrees, publication and first project are visible in the first screen, with projects prominent, a sticky education/models/stats rail, and restrained GSAP motion.

**Architecture:** Static GitHub Pages site, no build step. `index.html` is rewritten section by section, `style.css` is replaced with a fresh token-based stylesheet, `script.js` is rewritten as small named init functions. GSAP and brand SVGs are vendored into the repo (jsDelivr is unreachable from this machine, and self-hosting removes a runtime dependency). A Playwright test script (system Chrome) is the acceptance gate.

**Tech Stack:** HTML, CSS (custom properties, grid, container-free), vanilla JS, GSAP 3.15 (core, ScrollTrigger, SplitText, ScrambleTextPlugin) vendored under `js/lib/`, Simple Icons 16.x SVGs vendored under `docs/assets/models/`, Google Fonts (Space Grotesk, Inter, JetBrains Mono), Node + Playwright (tests only).

**Spec:** `docs/superpowers/specs/2026-09-27-portfolio-v6-bento-design.md`

## Global Constraints

- Title everywhere: **AI Engineer · Research & Data Science** at TurinTech. Never "Data Scientist" as his title (AB InBev role title "Data Scientist" is fine).
- No em dashes (`—`) anywhere in visible copy or meta.
- Min font size 0.78rem. Secondary text on dark at least `#c8c8c8`; on light at least `#3a4654`.
- Colours: bg `#0a0a0a`, card `#141414`, cyan `#00d4ff`, amber `#ffb020` (metrics/highlights only).
- Open source: 4 merged (vLLM, unsloth, sherpa-onnx, WhisperLiveKit), 2 in review (NVIDIA NeMo #16063, #16064). "190k+ stars across merged repos".
- No phone number anywhere. Contact is LinkedIn first, then email `eoinhoustoun@hotmail.com`.
- Never publish: client names, costs, internal repo/ticket names, colleague names, roadmap, product videos, OpenAI stock image, PowerPoint template slide.
- Every animation gated on `prefers-reduced-motion: no-preference`; all content visible if JS or GSAP fails.
- Jekyll excludes `vendor/` by default, so vendored JS lives in `js/lib/`, never `vendor/`.
- Commits: no AI attribution lines (Eoin's standing rule). Personal identity `EoinHoustoun <eoinhoustoun@hotmail.com>`.

## Review Focus

1. **Phone width (390px):** no horizontal scroll, bento tiles stack, side rail becomes accordions, first project card top within 2 x 844px. Test in Task 1 (`noHorizontalScroll`, `projectsWithinTwoScreens`).
2. **Reduced motion:** count-ups show final numbers, no scramble, marquee static, all sections visible. Test in Task 1 (`reducedMotionShowsFinalValues`).
3. **GSAP fails to load:** page still fully visible (no element left at opacity 0). Test in Task 1 (`noHiddenContentWithoutGsap`, blocks `js/lib/*`).
4. **Light theme:** every tile readable, logos visible (not white-on-white). Test in Task 1 (`lightThemeContrast` samples text colours).
5. **Keyboard users:** filter chips, accordions, Details expanders operable with Enter/Space and have `aria-expanded`/`aria-pressed`. Test in Task 1 (`keyboardFilters`).

---

## File Structure

| Path | Responsibility |
|---|---|
| `index.html` | Markup for all sections (rewritten) |
| `style.css` | Complete stylesheet: tokens, layout, components, themes, responsive (replaced) |
| `script.js` | `initTheme`, `initNav`, `initExpanders`, `initSlideshows`, `initFilters`, `initRailAccordions`, `initSpotlight`, `initConstellation`, `initMotion` |
| `js/lib/gsap.min.js`, `ScrollTrigger.min.js`, `SplitText.min.js`, `ScrambleTextPlugin.min.js` | Vendored GSAP 3.15 |
| `docs/assets/logos/{turintech,abinbev,goldsmiths,ucc,mit}.(svg|png)` | Employer/university marks |
| `docs/assets/models/{anthropic,openai,googlegemini,meta,mistralai,qwen,deepseek,huggingface,nvidia}.svg` | Model provider marks (Simple Icons, CC0) |
| `docs/assets/present_cyprus.jpg` | AIAI talk photo (resized) |
| `docs/assets/Eoin_Houstoun_CV.pdf` | Phone-free CV (only if producible; else CV button links to LinkedIn) |
| `tests/package.json`, `tests/site.test.mjs` | Playwright acceptance tests (node:test) |
| `.gitignore` | `tests/node_modules/`, `.superpowers/` |
| `_config.yml` | description updated; `exclude: [tests, docs/superpowers, CLAUDE.md]` |

---

### Task 1: Acceptance test harness

**Files:**
- Create: `tests/package.json`, `tests/site.test.mjs`, `.gitignore`

**Interfaces:**
- Produces: `cd tests && npm test` runs all checks against `http://localhost:8765/` (served by `python3 -m http.server 8765` from repo root). Later tasks rely on these test names.

- [ ] **Step 1: Write the harness**

`tests/package.json`:
```json
{ "name": "portfolio-tests", "private": true, "type": "module",
  "scripts": { "test": "node --test --test-concurrency=1 site.test.mjs" },
  "devDependencies": { "playwright": "^1.55.0" } }
```

`tests/site.test.mjs`:
```js
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
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(m.text()); });
  if (opts.blockGsap) await page.route('**/js/lib/**', r => r.abort());
  if (opts.theme) await page.addInitScript(t => localStorage.setItem('eh-theme', t), opts.theme);
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  return { page, ctx, errors };
}
const inFold = (page, sel) => page.$eval(sel, el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.width > 0; });

test('identity and proof are above the fold at 1440x900', async () => {
  const { page, ctx, errors } = await open();
  for (const sel of ['#hero .hero-name', '#hero .hero-role', '.tile-artemis', '.tile-paper', '.tile-edu', '.tile-sport', '.logo-strip'])
    assert.ok(await inFold(page, sel), `${sel} not in first viewport`);
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('facts: title, open source status, no phone, no em dash', async () => {
  const { page, ctx } = await open();
  const title = await page.title();
  assert.match(title, /AI Engineer/); assert.doesNotMatch(title, /Data Scientist/);
  const text = await page.evaluate(() => document.body.innerText + document.head.innerHTML);
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
  assert.ok(vals.length >= 4);
  for (const [shown, final] of vals) assert.equal(shown, final);
  await ctx.close();
});

test('noHiddenContentWithoutGsap', async () => {
  const { page, ctx } = await open({ blockGsap: true });
  const hidden = await page.$$eval('main section *, #hero *', els => els.filter(e => {
    const s = getComputedStyle(e); return e.innerText?.trim() && s.opacity === '0'; }).length);
  assert.equal(hidden, 0);
  await ctx.close();
});

test('lightThemeContrast', async () => {
  const { page, ctx } = await open({ theme: 'light' });
  const bad = await page.$$eval('p, li, .chip, .tile *', els => els.filter(e => {
    const c = getComputedStyle(e).color.match(/\d+/g).map(Number);
    return e.innerText?.trim() && (c[0] + c[1] + c[2]) / 3 > 150; }).map(e => e.className).slice(0, 5));
  assert.deepEqual(bad, [], 'light-grey text on light theme');
  await ctx.close();
});

test('keyboardFilters', async () => {
  const { page, ctx } = await open();
  const chip = page.locator('.filter-chip[data-filter="sports"]');
  await chip.focus(); await page.keyboard.press('Enter');
  assert.equal(await chip.getAttribute('aria-pressed'), 'true');
  const visible = await page.$$eval('#projects .project-card', els => els.filter(e => !e.hidden).map(e => e.dataset.cat));
  assert.ok(visible.length > 0 && visible.every(c => c.includes('sports')));
  await ctx.close();
});
```

`.gitignore`:
```
tests/node_modules/
.superpowers/
.DS_Store
```

- [ ] **Step 2: Install and run to verify tests fail on the current site**

Run: `(python3 -m http.server 8765 >/dev/null 2>&1 &); cd tests && npm install --silent && npm test`
Expected: FAIL on `identity and proof are above the fold` (`.tile-artemis` missing) and `facts` (NeMo shows Merged).

- [ ] **Step 3: Commit**

```bash
git add tests/package.json tests/site.test.mjs tests/package-lock.json .gitignore
git commit -m "Add Playwright acceptance tests for v6 layout"
```

---

### Task 2: Assets (vendored GSAP, logos, model icons, photos, CV)

**Files:**
- Create: `js/lib/*.min.js`, `docs/assets/logos/*`, `docs/assets/models/*.svg`, `docs/assets/present_cyprus.jpg`, optionally `docs/assets/Eoin_Houstoun_CV.pdf`
- Modify: `docs/assets/ai_chef.png` (recompress), `_config.yml`

- [ ] **Step 1: Vendor GSAP and Simple Icons from npm**

```bash
S=$TMPDIR/v6assets; mkdir -p $S && cd $S && npm init -y >/dev/null && npm i gsap@3.15.0 simple-icons@16 --silent
cd ~/Desktop/Projects/Portfolio && mkdir -p js/lib docs/assets/models docs/assets/logos
cp $S/node_modules/gsap/dist/{gsap,ScrollTrigger,SplitText,ScrambleTextPlugin}.min.js js/lib/
for i in anthropic openai googlegemini meta mistralai qwen deepseek huggingface nvidia; do cp $S/node_modules/simple-icons/icons/$i.svg docs/assets/models/ 2>/dev/null || echo "missing $i"; done
```
Expected: 4 JS files, up to 9 SVGs (if `openai` is missing in this version, render "GPT" as a text chip instead).

- [ ] **Step 2: Logos from Wikimedia Commons (official marks) + TurinTech badge**

```bash
get(){ curl -sL --max-time 30 -G https://commons.wikimedia.org/w/api.php --data-urlencode action=query --data-urlencode "titles=File:$1" --data-urlencode prop=imageinfo --data-urlencode iiprop=url --data-urlencode format=json | python3 -c "import sys,json;print(list(json.load(sys.stdin)['query']['pages'].values())[0]['imageinfo'][0]['url'])"; }
curl -sL "$(get 'Anheuser-Busch InBev - logo (Belgium, 2022-).svg')" -o docs/assets/logos/abinbev.svg
curl -sL "$(get 'Goldsmith University-logo.svg')" -o docs/assets/logos/goldsmiths.svg
curl -sL "$(get 'MIT 2023 red logo.svg')" -o docs/assets/logos/mit.svg
sips -Z 256 ~/Desktop/Projects/Photos_for_portfolio/Turintech_badge.png --out docs/assets/logos/turintech.png
```
UCC: query `https://en.wikipedia.org/w/api.php?action=query&titles=University_College_Cork&prop=pageimages&piprop=original&format=json` and save the infobox image as `docs/assets/logos/ucc.(svg|png)`. If none is usable, render a typographic "UCC" mark in CSS (`.logo-text`). Verify each file opens (`file docs/assets/logos/*`) and is not an HTML error page.

- [ ] **Step 3: Photos and compression**

```bash
sips -Z 1200 -s formatOptions 78 -s format jpeg ~/Desktop/Projects/Photos_for_portfolio/present_cyprus.jpg --out docs/assets/present_cyprus.jpg
sips -Z 1200 -s format png docs/assets/ai_chef.png --out docs/assets/ai_chef.png
find docs/assets -type f \( -name '*.png' -o -name '*.jpg' \) -size +600k -exec ls -la {} \;
```
Any remaining file >600 KB: resize to max 1400px with `sips -Z 1400`.

- [ ] **Step 4: Phone-free CV PDF**

Copy `~/Desktop/Important Documents/JOBS/Eoin_Houstoun_CV_AI_Engineer.docx` to `$TMPDIR/cv.docx`, remove the phone number run with python-docx (replace any text matching `\+44[\d\s]+` and a following separator with empty string), save, then export to PDF with Word:
```bash
osascript -e 'tell application "Microsoft Word"' -e "open POSIX file \"$TMPDIR/cv.docx\"" -e "save as active document file name \"$TMPDIR/cv.pdf\" file format format PDF" -e 'close active document saving no' -e 'end tell'
pdftotext $TMPDIR/cv.pdf - 2>/dev/null | grep -E '\+44|7895' && echo "PHONE STILL PRESENT"
```
Only if the PDF exists and contains no phone number: `cp $TMPDIR/cv.pdf docs/assets/Eoin_Houstoun_CV.pdf`. Otherwise skip; Task 3 points the CV button to LinkedIn. The original CV files are never modified.

- [ ] **Step 5: `_config.yml`**

```yaml
title: Eoin Houstoun
logo: docs/assets/me_hero.jpg
description: AI Engineer, Research and Data Science. Machine learning, statistics and probability modelling.
show_downloads: false
theme: jekyll-theme-minimal
exclude: [tests, docs/superpowers, CLAUDE.md, README.md]
```

- [ ] **Step 6: Commit**

```bash
git add js/lib docs/assets/logos docs/assets/models docs/assets/present_cyprus.jpg docs/assets/ai_chef.png _config.yml docs/assets/Eoin_Houstoun_CV.pdf 2>/dev/null
git commit -m "Vendor GSAP and brand icons, add logos, Cyprus photo, compress images"
```

---

### Task 3: Tokens, base styles, nav and bento hero + logo strip

**Files:**
- Modify: `index.html` (head, nav, `#hero`; delete old `#snapshot`), `style.css` (replace wholesale)

**Interfaces:**
- Produces CSS tokens used by all later tasks: `--bg, --bg-2, --card, --card-hover, --line, --text, --text-2, --cyan, --cyan-dim, --amber, --amber-dim, --radius, --font-display, --font-body, --font-mono`. Component classes: `.tile`, `.chip`, `.btn`, `.btn-primary`, `.btn-ghost`, `.eyebrow`, `.metric` (mono, tabular). Counter markup contract: `<span class="metric" data-count data-final="+107%" data-to="107" data-prefix="+" data-suffix="%">+107%</span>` (text starts at final value; JS animates from 0 only when motion is allowed).

- [ ] **Step 1: Head**: fonts `Space+Grotesk:wght@500;600;700`, `Inter:wght@400;500;600;700`, `JetBrains+Mono:wght@500;600`; `<title>Eoin Houstoun | AI Engineer · Machine Learning & Statistics</title>`; meta/OG description "AI Engineer on TurinTech's Research and Data Science team. Springer-published machine learning researcher, MSc Distinction (ranked 1st). Statistical modelling, probability and sports analytics."; bump `style.css?v=11`, `script.js?v=11`.

- [ ] **Step 2: Nav**: logo `EH`, links Work (`#projects`), Artemis (`#artemis`), Experience (`#experience`), Education (`#rail`), Contact (`#contact`), theme toggle, LinkedIn pill button. Add `<div class="scroll-progress" aria-hidden="true"></div>`.

- [ ] **Step 3: Hero markup**

```html
<header id="hero">
  <div class="bento">
    <article class="tile tile-id">
      <img class="hero-photo" src="docs/assets/me_hero.jpg" alt="Eoin Houstoun" fetchpriority="high">
      <div class="id-text">
        <p class="eyebrow"><img class="flag" src="docs/assets/flag_ie.png" alt=""> Irish · London</p>
        <h1 class="hero-name" data-scramble>Eoin Houstoun</h1>
        <p class="hero-role">AI Engineer · Research &amp; Data Science</p>
        <p class="hero-pitch">I build machine learning and statistical models, and the evidence that proves they work: agentic code optimisation at TurinTech, peer-reviewed clinical ML, and probability models for football.</p>
        <div class="hero-ctas">
          <a class="btn btn-primary" href="https://www.linkedin.com/in/eoin-houstoun-b0322b231/" target="_blank" rel="noopener">Message me on LinkedIn</a>
          <a class="btn btn-ghost" href="docs/assets/Eoin_Houstoun_CV.pdf" target="_blank" rel="noopener">CV</a>
          <a class="btn btn-ghost" href="https://github.com/EoinHoustoun" target="_blank" rel="noopener">GitHub</a>
        </div>
      </div>
    </article>
    <a class="tile tile-artemis" href="#artemis">
      <img class="tile-logo" src="docs/assets/logos/turintech.png" alt="TurinTech">
      <p class="eyebrow">Now · TurinTech</p>
      <span class="metric" data-count data-final="+107%" data-to="107" data-prefix="+" data-suffix="%">+107%</span>
      <p>Building <strong>Artemis</strong>: agents that optimise code, with the statistics that prove each gain is real.</p>
    </a>
    <a class="tile tile-paper" href="https://doi.org/10.1007/978-3-031-96235-6_5" target="_blank" rel="noopener">
      <p class="eyebrow">Springer · AIAI 2025</p>
      <p class="tile-title">Lead author, Alzheimer's ML</p>
      <p>Presented in Cyprus</p>
    </a>
    <a class="tile tile-edu" href="#rail">
      <p class="eyebrow">Education</p>
      <p class="tile-title">MSc AI &amp; Data Science</p>
      <p><span class="hl">Distinction · ranked 1st</span> · Goldsmiths</p>
      <p class="tile-title">BSc Data Science</p>
      <p><span class="hl">First Class Honours</span> · UCC</p>
    </a>
    <a class="tile tile-sport" href="#proj-fpred">
      <p class="eyebrow">Sports modelling</p>
      <span class="metric" data-count data-final="+£8.2k" data-to="8.2" data-decimals="1" data-prefix="+£" data-suffix="k">+£8.2k</span>
      <p>Premier League predictor, 2025-26 mock portfolio</p>
    </a>
  </div>
  <div class="logo-strip" aria-label="Worked at and studied at">
    <span class="eyebrow">Worked at · Studied at</span>
    <ul class="logo-track">
      <li><img src="docs/assets/logos/turintech.png" alt="TurinTech" title="TurinTech · AI Engineer"></li>
      <li><img src="docs/assets/logos/abinbev.svg" alt="AB InBev" title="AB InBev · Data Scientist"></li>
      <li><img src="docs/assets/logos/goldsmiths.svg" alt="Goldsmiths, University of London" title="Goldsmiths · MSc, AI Researcher"></li>
      <li><img src="docs/assets/logos/ucc.svg" alt="University College Cork" title="UCC · BSc"></li>
      <li><img src="docs/assets/logos/mit.svg" alt="MIT" title="MIT · Machine Learning (scholarship)"></li>
    </ul>
  </div>
</header>
```
If Task 2 produced no CV PDF, replace the CV href with the LinkedIn URL and label it "CV on request". Paper tile uses `present_cyprus.jpg` as a CSS background with a dark gradient overlay.

- [ ] **Step 4: style.css (replace)**: tokens, dark + light (`[data-theme="light"]`) themes, base type, `.bento` grid:

```css
.bento{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:auto auto;gap:14px;max-width:1200px;margin:0 auto;padding:88px 24px 0}
.tile-id{grid-row:span 2;display:grid;grid-template-columns:180px 1fr;gap:24px;align-items:center}
@media (max-width:900px){.bento{grid-template-columns:1fr 1fr;padding-top:76px}.tile-id{grid-column:1/-1;grid-row:auto}}
@media (max-width:560px){.bento{grid-template-columns:1fr}.tile-id{grid-template-columns:1fr;text-align:left}.hero-photo{width:112px;height:112px;border-radius:50%}}
.logo-track img{height:28px;width:auto;filter:grayscale(1) brightness(1.6);opacity:.75;transition:filter .3s,opacity .3s}
.logo-track li:hover img,.logo-track li:focus-within img{filter:none;opacity:1}
[data-theme="light"] .logo-track img{filter:grayscale(1);opacity:.8}
```
Hero name `clamp(2.4rem,4.2vw,3.6rem)` Space Grotesk 700; `.metric` JetBrains Mono, `font-variant-numeric: tabular-nums`, amber. Tiles: `--card` bg, 1px `--line` border, radius 18px, spotlight pseudo-element `radial-gradient(400px circle at var(--mx) var(--my), rgba(0,212,255,.10), transparent 40%)`.

- [ ] **Step 5: Run tests**: `cd tests && npm test`. Expected: `identity and proof are above the fold` PASS. Screenshot 1440x900 and 390x844 and eyeball.

- [ ] **Step 6: Commit**: `git commit -am "Bento hero, logo strip and new design tokens"`

---

### Task 4: Two-column body + side rail (Education, Models, Stats toolkit, Stack)

**Files:** Modify `index.html`, `style.css`

**Interfaces:**
- Produces: `<div class="body-grid"><main id="main">...</main><aside id="rail">...</aside></div>`. Rail sections are `<details class="rail-block" open>` on desktop; `initRailAccordions` (Task 7) closes them at <900px.

- [ ] **Step 1: Layout CSS**

```css
.body-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:40px;max-width:1200px;margin:56px auto 0;padding:0 24px}
#rail{position:sticky;top:84px;align-self:start;max-height:calc(100vh - 100px);overflow:auto;scrollbar-width:thin}
@media (max-width:900px){.body-grid{grid-template-columns:1fr}#rail{position:static;max-height:none;order:2}}
```
On mobile, rail sits after Projects/Artemis (order 2 inside a flex column where `main` sections are split: projects, artemis first; rail; experience, oss, contact). Implement with `display:flex;flex-direction:column` and `order` values on `#projects`(1), `#artemis`(2), `#rail`(3), `#experience`(4), `#opensource`(5), `#contact`(6) at <900px, using `display:contents` on `main`.

- [ ] **Step 2: Rail markup**
  - Education `<details class="rail-block" open><summary>Education</summary>`: four rows, each with logo (24px), degree, school, badge:
    - MSc Artificial Intelligence & Data Science · Goldsmiths · 2024-25 · badge "Distinction · ranked 1st · 87%", sub "Dissertation 92%"
    - BSc Data Science & Analytics · UCC · 2020-24 · badge "First Class Honours", sub "College Scholar (Year 1) · Dissertation on ML validation (First, 72%)". Expandable "Mathematical core" list with standout marks as small amber tags: Calculus (90), Statistical Theory of Estimation (88), Hypothesis Testing (83), Computational Machine Learning (83), Multivariate Methods (80); then untagged: Probability & Mathematical Statistics, Stochastic Modelling, Regression, Survival Analysis, Time Series, Statistical Methods for ML I & II, Linear Algebra, Mathematical Modelling, Algorithm Analysis. Never show marks for GLMs or Multivariable Calculus.
    - Machine Learning: Making Data-Driven Decisions · MIT (scholarship) · 2025 · link to ePortfolio
    - Modelling Expected Goals · AnalyiSport · 2022 · link `docs/assets/EoinHoustoun-Modelling-Expected-Goals-Course-Certificate-AnalyiSport.pdf`
    - Row hover/expand shows grad photo (`goldsmiths_grad.jpg`, `ucc_grad.jpg`) in a 16:9 thumbnail.
  - Models `<details class="rail-block" open><summary>Models I benchmark &amp; build with</summary>`: 3x3 icon grid from `docs/assets/models/*.svg` inlined as `<img>` with labels Claude, GPT, Gemini, Llama, Mistral, Qwen, DeepSeek, Hugging Face, NVIDIA; caption "Benchmarked and optimised on Artemis. Hands-on: BitNet b1.58, Qwen3.5-0.8B, LFM2.5-350M, Parakeet, Whisper." Icons rendered monochrome via CSS `filter: invert(1)` on dark (Simple Icons are black), `none` on light.
  - Statistical toolkit: groups with chips: Inference (Welch CIs, power analysis, Holm, bootstrap, paired A/B); Bayesian (empirical Bayes shrinkage, Gaussian process drift, hierarchical priors); Probability & sport (Dixon-Coles, Poisson, Elo, Kelly, Monte Carlo, xG); Machine learning (XGBoost, PyTorch, calibration, nested CV, SHAP, transformers); Optimisation (MILP, Optuna).
  - Stack: Python, R, SQL, PyTorch, scikit-learn, vLLM, FastAPI, Streamlit, Docker, Git as small chips.

- [ ] **Step 3: Run tests + screenshot**; rail sticky at 1440 while scrolling; accordions at 390.
- [ ] **Step 4: Commit**: `git commit -am "Two-column body with sticky education, models and stats rail"`

---

### Task 5: Projects (filters, cards, corrected copy)

**Files:** Modify `index.html` (`#projects`), `style.css`

**Interfaces:**
- Card contract: `<article class="project-card" data-cat="sports research" id="proj-...">`; filter chips `<button class="filter-chip" data-filter="all|sports|clinical|nlpcv|research" aria-pressed="true|false">`. Cards with class `extra` are hidden until "Show all" unless a filter is active.

- [ ] **Step 1: Header + filters**: eyebrow "Selected work", h2 "Projects", chips All · Sports modelling · Clinical AI · NLP & vision · Research.
- [ ] **Step 2: Cards**, order and copy (keep existing images/slideshows, GitHub links, Details expanders):
  1. Alzheimer's Disease Classification (featured, full width, `research clinical`): glance "Lead-author Springer paper: classifying cognitive states from digital biomarkers in the Bio-Hermes cohort." chips Springer · AIAI 2025 / Nested Monte Carlo CV / Calibrated probabilities. Details: existing citation block, change "Invited to present" to "Travelled to Limassol, Cyprus to present".
  2. Premier League Match Predictor (`sports`, id `proj-fpred`): glance "+£8.2k mock-portfolio profit across 2025-26 from a calibrated match model staking by Kelly." chips Elo + market anchor / Draw calibration / Walk-forward validated. Details: "Team ratings anchored to the betting market, calibrated outcome probabilities with a draw correction, fractional Kelly staking and walk-forward backtests; run live through two seasons with closing-line value tracked." stack Python, Poisson, Elo, Isotonic calibration, Kelly, Monte Carlo, Streamlit.
  3. Fantasy Football AI Planner (`sports`): glance "Expected-points engine and optimiser for every FPL decision: transfers, captain, chips." chips Component xP model / MILP squad optimiser / Monte Carlo risk. Details: consensus projections, minutes model, multi-week transfer MILP with hit cost, Monte Carlo floor/ceiling; stack Python, PuLP/MILP, Monte Carlo, Streamlit.
  4. Football Transfer Intelligence Agent (`sports`): glance "0-100 within-position scouting grades across 8 leagues, with LLM-written scouting reports." chips League-adjusted grading / Minutes shrinkage / LLM reports. Details keep stacked XGBoost + LightGBM, Optuna, xG/xA.
  5. Fever Prediction with Infrared Thermography (`clinical`): unchanged copy.
  6. Pediatric Appendicitis Prediction (`clinical`, Live demo): unchanged.
  7. Validation Procedures Exploration (`research sports`, badge Research, was Sports): glance "BSc dissertation (First): 10 validation methods compared on 1,316 football transfers; final model 43% better than baseline." chips Bootstrap vs k-fold vs LOO / Internal-external validation / R² 0.70. Details: "Fuzzy-matched FIFA player data (106k players, 2017-21) to Transfermarkt fees for 1,316 top-five-league transfers. Compared split-sample, k-fold, repeated k-fold, Monte Carlo CV, leave-one-out, bootstrap and internal-external validation. Bootstrap matched the best error with higher precision from fewer iterations; LOO was optimistic and high-variance; validation exposed an overfitting random forest, so the simpler log-linear model (R² 0.70) was chosen." Remove the unsupported "±€8M RMSE" line.
  8-10 (`extra`): Neural Style Transfer (`nlpcv`), AI Chef (`nlpcv`), YouTube Sentiment (`nlpcv`); Additional projects row kept inside the extra block.
- [ ] **Step 3: Card CSS**: 2-col grid, featured spans 2; image 16:9 `object-fit:cover` (contain for posters/diagrams via `.contain`); tilt handled by JS; category badge colours: research purple, clinical green, sports cyan, nlpcv amber.
- [ ] **Step 4: Run tests**: `keyboardFilters` still fails until Task 7 wires JS; all layout tests pass.
- [ ] **Step 5: Commit**: `git commit -am "Projects with filters and CV-aligned copy"`

---

### Task 6: Artemis block, Experience, Open Source, Contact, Footer

**Files:** Modify `index.html`, `style.css`

- [ ] **Step 1: `#artemis`** (after `#projects` in main):

```html
<section id="artemis">
  <p class="eyebrow">TurinTech · Research &amp; Data Science</p>
  <h2>Artemis: optimisation you can trust</h2>
  <p class="lede">Artemis is TurinTech's code optimisation platform: agents explore a codebase, hypothesise changes, benchmark them and select the best improvement. I build the agentic system behind that loop and brought <strong>statistical testing, confidence intervals and A/B validation</strong> to the platform, so every reported gain is proven real rather than noise.</p>
  <div class="metric-grid">
    <div class="metric-card"><span class="metric" data-count data-final="+107%" data-to="107" data-prefix="+" data-suffix="%">+107%</span><p>throughput on a simulation workload</p></div>
    <div class="metric-card"><span class="metric" data-count data-final="-49%" data-to="49" data-prefix="-" data-suffix="%">-49%</span><p>CPU in a benchmark harness</p></div>
    <div class="metric-card"><span class="metric">6/6 vs 1/6</span><p>significant wins, scoped vs open briefs, at 59% lower cost</p></div>
    <div class="metric-card"><span class="metric" data-count data-final="-25%" data-to="25" data-prefix="-" data-suffix="%">-25%</span><p>token cost per optimisation campaign</p></div>
    <div class="metric-card"><span class="metric" data-count data-final="14x" data-to="14" data-suffix="x">14x</span><p>efficiency gap measured across 11 LLMs</p></div>
    <div class="metric-card"><span class="metric" data-count data-final="+9.8%" data-to="9.8" data-decimals="1" data-prefix="+" data-suffix="%">+9.8%</span><p>generation speed on a 1.58-bit LLM</p></div>
  </div>
  <div class="artemis-split">
    <ul class="method-list">
      <li><strong>Validation layer:</strong> Welch confidence intervals and significance-gated verdicts</li>
      <li><strong>Run planning:</strong> power analysis picks how many benchmark repeats each result needs</li>
      <li><strong>Scoring:</strong> empirical Bayes shrinkage so noisy wins do not outrank reliable ones</li>
      <li><strong>Drift:</strong> Gaussian process model separates machine drift from real change</li>
      <li><strong>Agents:</strong> multi-agent systems on the Claude API, including subagents that guide users through benchmark setup</li>
    </ul>
    <img src="docs/assets/artemis_benchmark.jpg" alt="Artemis inference benchmarking results" loading="lazy">
  </div>
</section>
```

- [ ] **Step 2: `#experience`**: three compact rows (logo 36px, role, company · place, dates, one line, chips, Details). TurinTech row: "AI Engineer · Research & Data Science team", line "Agentic code optimisation and the statistics behind it (see Artemis above)", chips Statistical validation / Multi-agent systems / Client engineering teams; Details = existing 5 bullets minus the Open source bullet. Goldsmiths AI Researcher: Details bullet 1 becomes "Built classification pipelines on blood-based biomarkers with nested Monte Carlo cross-validation, probability calibration and FDR-controlled feature selection on a small clinical cohort." AB InBev Data Scientist (Global Innovation Centre, Leuven, Consumer Science team): replace bullets with source-verified ones:
    - "Ran head-to-head consumer taste studies (hundreds of respondents each): ANOVA, proportion z-tests, preference and Just-About-Right penalty analysis, and delivered results to internal clients."
    - "Built a PCA-based purchase-intent simulator that predicts intent from sensory and chemical attributes, shipped as an interactive tool for product developers."
    - "Automated reporting: a Python PowerPoint generator that removed manual table building, and a script that flags significant penalty effects automatically."
    - "Text analytics on open-ended survey answers (tokenisation, stop-word removal, frequency visualisation)."
    - "Consolidated 21 studies into the core consumer database and trained two new data science consultants on the pipeline."
    - "Caught a weighting error in a colleague's analysis (dividing by count of weights, not their sum) before results went out."
    Glance line: "Consumer statistics, predictive tools and automation for global beer innovation." Chips: Hypothesis testing / PCA purchase-intent tool / Reporting automation. "16+ projects" and "5 days to 3" are used ONLY if Eoin confirms them (not found in placement documents). Never name markets, colleagues, internal tool names or penalty thresholds.Hover: row highlights, siblings dim to 0.6 opacity (`.xp-list:hover .xp-row:not(:hover)`).
- [ ] **Step 3: `#opensource`**: one card. Lede: "Bugs reported upstream, fixed with the Artemis agent, then every line reviewed, tested and defended in review by hand. 4 merged into projects with 190k+ combined stars." Rows: vLLM (90k) merged · unsloth (75k) merged · sherpa-onnx (14k) merged · WhisperLiveKit (11k, -51.9% ASR compute) merged · NVIDIA NeMo Speech (18k, 2 PRs) `<span class="status status-review">In review</span>`. Merged badges use class `status status-merged`.
- [ ] **Step 4: `#contact`**: h2 "Let's talk", line "The fastest way to reach me is LinkedIn." Cards: LinkedIn (primary, cyan), Email `mailto:eoinhoustoun@hotmail.com`, GitHub, CV (or LinkedIn fallback), Springer paper.
- [ ] **Step 5: Footer**: "Eoin Houstoun · AI Engineer · London", `© <span id="year">2026</span>`, links.
- [ ] **Step 6: Run tests**: `facts` PASS. Commit: `git commit -am "Artemis feature block, compact experience, corrected open source, LinkedIn-first contact"`

---

### Task 7: JavaScript (interactions + GSAP motion)

**Files:** Replace `script.js`; add `<script src="js/lib/gsap.min.js" defer>` (+ ScrollTrigger, SplitText, ScrambleTextPlugin) before `<script src="script.js?v=11" defer>` in `index.html`.

**Interfaces:**
- Consumes: markup contracts from Tasks 3-6 (`data-count`, `data-final`, `data-to`, `data-prefix`, `data-suffix`, `data-decimals`, `.filter-chip[data-filter]`, `.project-card[data-cat]`, `.expander-toggle[aria-controls]`, `.rail-block`, `.tile`, `[data-scramble]`, `#constellation`, `.scroll-progress`, `#themeToggle`, `#navToggle`).

- [ ] **Step 1: Structure**

```js
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.addEventListener('DOMContentLoaded', () => {
  [initTheme, initNav, initExpanders, initSlideshows, initFilters, initRailAccordions,
   initSpotlight, initConstellation, initMotion].forEach(fn => { try { fn(); } catch (e) { console.warn(fn.name, e); } });
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
});
```
Port `initTheme`, `initNav`, `initExpanders`, `initSlideshows`, `initConstellation` from the current `script.js` (same behaviour; constellation node alpha reduced to 0.5x, disabled when `reduceMotion`). Remove the typing effect and the old `.fade-in` observer.

- [ ] **Step 2: Filters**

```js
function initFilters() {
  const chips = [...document.querySelectorAll('.filter-chip')];
  const cards = [...document.querySelectorAll('#projects .project-card')];
  const grid = document.getElementById('projectsGrid');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.setAttribute('aria-pressed', String(c === chip)));
    const f = chip.dataset.filter;
    grid.classList.toggle('filtered', f !== 'all');
    cards.forEach(card => { card.hidden = f !== 'all' && !card.dataset.cat.split(' ').includes(f); });
  }));
}
```
Buttons are native `<button>`, so Enter/Space work. CSS: `.projects-grid:not(.expanded):not(.filtered) .extra{display:none}`.

- [ ] **Step 3: Rail accordions**: at `matchMedia('(max-width: 900px)')` remove `open` from all `.rail-block` except the first; re-add when widening.

- [ ] **Step 4: Spotlight + tilt**

```js
function initSpotlight() {
  if (reduceMotion || matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.tile, .project-card, .metric-card').forEach(el => {
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
      if (el.classList.contains('project-card')) {
        const rx = ((e.clientY - r.top) / r.height - .5) * -3, ry = ((e.clientX - r.left) / r.width - .5) * 3;
        el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`; } });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}
```

- [ ] **Step 5: Motion (GSAP)**

```js
function initMotion() {
  const bar = document.querySelector('.scroll-progress');
  if (bar) addEventListener('scroll', () => { const h = document.documentElement;
    bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - innerHeight || 1)})`; }, { passive: true });
  if (reduceMotion || !window.gsap) return;               // content is already visible and final
  gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin);
  gsap.from('.bento .tile, .logo-strip', { y: 18, opacity: 0, duration: .5, stagger: .06, ease: 'power2.out', clearProps: 'all' });
  const name = document.querySelector('[data-scramble]');
  if (name) gsap.to(name, { duration: 1.1, scrambleText: { text: name.textContent, chars: '01', speed: .5 } });
  document.querySelectorAll('[data-count]').forEach(el => {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.decimals || 0), o = { v: 0 };
    const fmt = v => `${el.dataset.prefix || ''}${v.toFixed(dec)}${el.dataset.suffix || ''}`;
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () =>
      gsap.to(o, { v: to, duration: 1.2, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v); },
        onComplete: () => { el.textContent = el.dataset.final; } }) });
  });
  gsap.utils.toArray('main section, #rail .rail-block, .project-card').forEach(el =>
    gsap.from(el, { y: 24, opacity: 0, duration: .55, ease: 'power2.out', clearProps: 'opacity,transform',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true } }));
}
```
Counters only rewrite text after `onEnter`, so blocked GSAP / reduced motion leave `data-final` text in place. Marquee: CSS `@media (max-width:560px) and (prefers-reduced-motion: no-preference){.logo-track{animation:marquee 28s linear infinite}}` with the list duplicated via JS (`aria-hidden` clone) only in that case.

- [ ] **Step 6: Run all tests**: `cd tests && npm test`. Expected: all 7 PASS, no console errors.
- [ ] **Step 7: Commit**: `git commit -am "Rewrite script.js: filters, rail accordions, spotlight, GSAP motion"`

---

### Task 8: Polish, light theme, verification, docs

**Files:** Modify `style.css`, `CLAUDE.md`, `README.md` (title line only)

- [ ] **Step 1: Visual pass**: screenshots at 1440x900, 1280x800, 768x1024, 390x844, dark and light, full page. Fix any overlap, clipped text, empty gaps, image crops (faces not cut). Compare against `cur_*.png` baselines.
- [ ] **Step 2: Performance/a11y**: every `<img>` has `alt`, `width`/`height` or aspect-ratio; below-fold images `loading="lazy"`; total transferred on first load < 2.5 MB (check via Playwright `page.on('response')` sum). Run `npx lighthouse http://localhost:8765 --only-categories=performance,accessibility --quiet --chrome-flags="--headless"` if available; target >= 90.
- [ ] **Step 3: Link check**: collect all `a[href^="http"]`, HEAD each with curl (`--max-time 15`), report non-2xx/3xx (LinkedIn returns 999; ignore).
- [ ] **Step 4: Update `CLAUDE.md`**: new structure (sections, rail, card contract, filters, `data-count` contract, vendored libs in `js/lib/`), remove the instruction to extract the PAT from the remote URL, replace the design system block with the new tokens. `README.md`: first line title to "AI Engineer".
- [ ] **Step 5: Run tests** (all PASS) and commit: `git commit -am "Polish, light theme checks, updated project docs"`
- [ ] **Step 6: Hand-off**: show Eoin screenshots; on his OK merge `portfolio-v6-bento` into `main` and push to `pages` and `origin`. Do not push before his OK.
