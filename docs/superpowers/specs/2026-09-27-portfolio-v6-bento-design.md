# Portfolio v6: Bento Hero + Side Rail, Design Spec

**Date:** 2026-09-27
**Repo:** `Desktop/Projects/Portfolio`, deployed to https://EoinHoustoun.github.io (push to `pages` and `origin`)
**Branch:** `portfolio-v6-bento`
**Scope:** `index.html`, `style.css`, `script.js`, new images in `docs/assets/`. No changes to project repos.

## Goal

A hiring manager for ML, data science or sports modelling roles should know who Eoin is, where he works, what he has studied, what he has published and what he builds, in one screen and under 30 seconds. Today projects start ~3,300px down on desktop and ~7,000px on mobile. Target: all identity signals above the fold at 1440x900, first project card within ~2 screens on a 390px phone.

Evidence behind the structure: recruiter eye-tracking (Ladders 2018) shows fixation on job titles first, then company names, in an F-pattern. So the first screen reads name, title, employer logos, proof numbers, then work.

## Decisions (agreed 2026-09-27)

1. **Layout:** bento hero, logo strip, then two columns: main column (Projects, Artemis, Experience, Open Source) and a sticky side rail (Education, Models, Stats toolkit). Side rail collapses into accordions on mobile.
2. **TurinTech:** name Artemis, show the TurinTech logo and public-safe campaign numbers. Never: client names, costs/budgets, internal repo/ticket names, colleague names, roadmap.
3. **Animation:** GSAP 3.15 core + ScrollTrigger + SplitText + ScrambleText via jsDelivr (~54 KB gz). No other animation libraries.
4. **Palette:** keep electric cyan `#00d4ff` as primary, add one warm secondary accent (amber `#ffb020`) used only for metrics/highlights. Dark default, light theme retained.

## 1. Hero (bento grid, first viewport)

Grid of 5 tiles, max-width ~1200px, fits 1440x900 including nav and logo strip.

| Tile | Content |
|---|---|
| Identity (large, 2x2) | Photo (me_hero.jpg), "Eoin Houstoun" (ScrambleText once), title **AI Engineer · Research & Data Science**, two-line pitch about ML, statistics and probability modelling, buttons: Email, CV, GitHub, LinkedIn |
| Artemis | TurinTech logo, "Building Artemis", count-up headline "+107%", subline "statistically validated code optimisation" |
| Publication | Springer AIAI 2025, lead author, Cyprus talk photo as background (present_cyprus.jpg, darkened), link to paper |
| Education | MSc AI & DS Distinction, ranked 1st, 87% · BSc First Class Honours |
| Sports modelling | F_PRED tile with one metric (+£8.2k across 2025-26 mock portfolio) linking to the project card |

Below the grid: **"Worked at / Studied at"** logo strip: TurinTech, AB InBev, Goldsmiths, UCC, MIT. Greyscale + reduced opacity by default, full colour on hover/focus, with a tooltip. Static row on desktop; slow CSS marquee on mobile (paused on hover, disabled for reduced motion).

The current typing title (shows "Data Scientist") is removed.

## 2. Main column

Order: Projects, Artemis, Experience, Open Source, Contact.

**Projects.** Filter chips: All · Sports Modelling · Clinical AI · NLP & CV · Research. 6 featured cards in a 2-col grid (Alzheimer's full width on top), remaining projects behind "Show all". Each card: image, category badge, title, one-line result with metric, 2 to 3 fact chips, collapsible Details (method, stack), links. Hover: spotlight glow + 3 degree tilt.
Copy aligned with the CV:
- Match predictor: Elo-style ratings with a market anchor, calibration and draw correction, Kelly staking, walk-forward validated, run live.
- FPL planner: expected-points engine, consensus projections, MILP squad optimiser, Monte Carlo.
- Transfer Intelligence: 8-league 0-100 within-position grading with league adjustment and minutes shrinkage, LLM scouting reports.
- Validation Procedures: category corrected from Sports Analytics to Research (BSc dissertation, First).

**Artemis feature block.** Short explanation (agents explore a codebase, hypothesise changes, benchmark them, pick the best), Eoin's headline (statistical testing, confidence intervals, A/B validation), a 4 to 6 item metric grid with count-ups:
- +107% throughput on a simulation workload
- -49% CPU in the benchmark harness
- 6/6 vs 1/6 significance-tested wins for scoped vs open briefs, at 59% lower cost
- -25% token cost per campaign
- 14x efficiency gap across 11 models
- +9.8% generation speed on a 1.58-bit LLM
Plus the methods list (Welch CIs, power-based run planning, empirical Bayes shrinkage, Gaussian process drift, paired A/B) and the benchmark infographic.

**Experience.** Compact rows with the company logo, role, dates, one line, chips, and a collapsible Details. TurinTech row links to the Artemis block. Rows highlight on hover, siblings dim.

**Open Source.** One compact card: "4 merged PRs into vLLM, unsloth, sherpa-onnx and WhisperLiveKit (190k+ combined stars), 2 in review at NVIDIA NeMo". Per-repo list with correct status (NeMo = In review). Framing: bugs reported upstream, fix produced with the agent, every line reviewed, tested and defended by hand.

**Contact.** Email (eoinhoustoun@hotmail.com), LinkedIn, GitHub, CV download, Springer paper. No phone number.

## 3. Side rail (sticky on desktop, accordions on mobile)

- **Education:** MSc (Goldsmiths, Distinction, ranked 1st, 87%, dissertation 92%), BSc (UCC, First, validation dissertation), MIT scholarship course, AnalyiSport "Modelling Expected Goals" certificate. Small logos, not big photos; the grad photos show on hover/expand.
- **Models I benchmark and build with:** monochrome Simple Icons row (Claude, GPT, Gemini, Llama, Mistral, Qwen, DeepSeek, Hugging Face, NVIDIA) with the line "evaluated and optimised on Artemis". Named hands-on models as text: BitNet b1.58, Qwen3.5-0.8B, LFM2.5-350M, Parakeet (NeMo), Whisper streaming ASR.
- **Statistical toolkit:** grouped tags. Inference (Welch, power analysis, Holm, bootstrap), Bayesian (empirical Bayes, GP drift, shrinkage), Probability & sport (Dixon-Coles, Poisson, Elo, Kelly, Monte Carlo), ML (XGBoost, PyTorch, calibration, nested CV, SHAP), Optimisation (MILP).
- **Stack:** Python, R, SQL, PyTorch, scikit-learn, vLLM, FastAPI, Streamlit, Docker (compact icons).

## 4. Motion

- Hero: staggered tile reveal on load (<600ms total), name ScrambleText once.
- Count-ups on metrics when first in view (final values shown immediately under reduced motion).
- Section reveals via ScrollTrigger; content visible by default if JS/GSAP fails.
- Cursor spotlight on tiles/cards (CSS custom properties), 3 degree tilt on project cards only.
- Scroll progress bar under the nav.
- Constellation canvas kept, dimmed further.
- Everything gated on `prefers-reduced-motion: no-preference`. No typing effects, no parallax on text, no confetti.

## 5. Visual system

- Fonts: Space Grotesk (display), Inter (body), JetBrains Mono with tabular numbers for every metric.
- Colours: bg `#0a0a0a`, card `#141414`, cyan `#00d4ff`, amber `#ffb020`. Text secondary raised to at least `#c8c8c8` on dark (Eoin cannot read light grey). Min font 0.78rem.
- No em dashes anywhere in copy.

## 6. Assets

- Add: present_cyprus.jpg, TurinTech logo, AB InBev / Goldsmiths / UCC / MIT logos (official press pages), Simple Icons SVGs inlined.
- Compress: ai_chef.png (3.9 MB), other images >500 KB; resize to display size x2.
- Don't use: OpenAI press stock image, PowerPoint template slide, internal product videos.

## 7. Fixes carried in

- PR count: 4 merged + 2 in review (verified on GitHub 27 Sep 2026). "Over 200,000 stars" becomes "190k+ stars across merged repos".
- Footer year and title ("AI Engineer" not "Data Scientist & AI Engineer"). Page `<title>` and OG description updated.
- Goldsmiths: "travelled to Cyprus to present" (not "invited").
- Remove the large empty gap before Projects.

## 8. Testing

- Playwright screenshots at 1440x900, 1280x800, 390x844, both themes; assert hero tiles and logo strip are in the first viewport at 1440x900.
- Reduced-motion run: all content visible, no count-up from zero.
- No console errors; Lighthouse performance and accessibility >= 90.
- Link check on every external link.

## Open item

- CV download: publish a PDF copy of the 28 Aug CV **without the phone number**. If no phone-free PDF is ready, the button links to LinkedIn until one is.
