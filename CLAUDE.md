# Claude Instructions, Eoin Houstoun Portfolio

This is Eoin Houstoun's personal portfolio repository, deployed as a GitHub Pages site at **https://EoinHoustoun.github.io**.

The portfolio showcases data science and AI engineering projects. Eoin has a **published research paper at AIAI 2025 (Springer)**, this is his lead credential and must always be treated as the most prominent item.

---

## How to Add a New Project (Autonomous Workflow)

When Eoin gives you a new project folder or repo to add, do ALL of the following without asking, this is the full expected workflow:

### Step 1: Understand the project
Read the existing code, notebooks, and any existing README in the project folder/repo. Extract:
- What problem it solves
- What models/techniques were used
- Any real metrics or results (accuracy, F1, AUC, RMSE, etc.)
- What language/libraries were used
- Whether there is a live demo (Gradio, Streamlit, etc.)

### Step 2: Write the project README
Write a professional README.md for the project repo following this exact template:

```markdown
# [Project Title]

[1-2 sentence description of what the project does and why it matters]

[![Python](badge)] [other relevant badges]

## Overview
- **Problem:** what problem is being solved
- **Approach:** what ML/AI methods were used
- **Result:** key metric or outcome (use real numbers if available)

## Key Features
- Bullet points of technical depth

## Tech Stack
| Category | Tools |
|---|---|
| Language | Python / R |
| Models | ... |
| Libraries | ... |
| Visualisation | ... |

## Results
[Key findings with real metrics in tables where possible]

## How to Run
[install + run commands]

## Project Structure
[brief file tree]

---
*Part of Eoin Houstoun's Data Science Portfolio, [github.com/EoinHoustoun](https://github.com/EoinHoustoun)*
```

Rules for the README:
- Use shields.io badges at top for language and key libraries
- If there's a live Gradio/Streamlit demo, add a badge at the very top
- Keep language confident: "achieved", "demonstrated", "deployed"
- Every sentence must add value, no filler
- Use real numbers from the code/results wherever possible

### Step 3: Add a project card to index.html
Add an `<article class="project-card" data-cat="...">` inside `#projectsGrid` (before the `.extra` cards unless minor; minor projects get class `extra`).
`data-cat` is a space-separated list of filter keys: `sports`, `clinical`, `nlpcv`, `research`. Copy an existing card: media, `.card-tags` badges (`badge-research|clinical|sports|nlp|ai|live|muted`), `h3`, one-line `.glance` with the headline metric in `<span class="hl">`, 2-3 `.chip`s, a Details expander (`.expander-toggle[aria-controls]` + `.expander-body`), `.card-actions`. If the "Show all" count changes, update the `(+N)` in both index.html and script.js.

### Step 4: Add the project to README.md
Add a new row to the projects table in `README.md`:
```markdown
| [Project Name](https://github.com/EoinHoustoun/REPO) | Category | Key Models | Status |
```

Then add a project highlight section following the same pattern as existing ones (title, description, bullet points, image if available, repo link).

### Step 5: Test and push
Serve the repo (`python3 -m http.server 8765`), run `cd tests && npm test` (Playwright, system Chrome), then commit and push to both `pages` and `origin`. Credentials come from the git credential helper or `gh auth`; never embed or copy a token.

---

## Portfolio Structure (v6, Sep 2026)

- `index.html`: nav, `#hero` (bento tiles + "Worked at / Studied at" logo strip), then `.body-grid` = `main` (`#projects`, `#artemis`, `#experience`, `#opensource`, `#contact`) + sticky `aside#rail` (Education, Models, Statistical toolkit, Stack). On <900px the rail folds into accordions and sits after Artemis.
- `style.css`: tokens at the top (`--bg`, `--card`, `--text`, `--text-2`, `--cyan`, `--amber`, fonts), light theme under `[data-theme="light"]`, responsive blocks at the bottom.
- `script.js`: one init function per feature (theme, nav, expanders, slideshows, project filters, rail, marquee, spotlight, constellation, GSAP motion).
- `js/lib/`: vendored GSAP 3.15 (core, ScrollTrigger, ScrambleTextPlugin). Not `vendor/` (Jekyll excludes it).
- `docs/assets/logos/` organisation logos (shown on light plates), `docs/assets/models/` AI model icons (inlined into the rail).
- `tests/`: Playwright acceptance tests (fold contents, facts, phone layout, reduced motion, no-GSAP fallback, light contrast, keyboard filters).
- Specs and plans live in `docs/superpowers/`.

## Design System

- Colours: bg `#0a0a0a`, card `#141518`, cyan `#00d4ff` (primary), amber `#ffb020` (metrics and highlights only). Secondary text never lighter than `#c9cdd3` on dark or darker than `#3a4654` on light: Eoin cannot read light grey.
- Fonts: Space Grotesk (headings), Inter (body), JetBrains Mono (numbers, `.metric`).
- Minimum font size 0.78rem. No em dashes anywhere.
- Counters: `<span class="metric" data-count data-final="+107%" data-to="107" data-prefix="+" data-suffix="%">+107%</span>`. Text starts at the final value; JS animates only when motion is allowed.
- Every animation respects `prefers-reduced-motion`; content must be visible if JS or GSAP fails.
- Title is always "AI Engineer · Research & Data Science" (TurinTech). Contact is LinkedIn first; never publish the phone number.

## Content Rules (Eoin, Sep 2026)

- Never host or link a CV on the site. Contact is LinkedIn first, email second, never a phone number.
- No money figures on the first screen. Model P&L (e.g. the match predictor) appears only inside that project's Details, described as a simulated paper portfolio.
- No employer product metrics as headline stats. Describe what Eoin built at TurinTech (statistical validation, agents, benchmarking, client onboarding on Artemis and evoML).
- Keep the MSc 87% average (ranked 1st) prominent and show start and end months for every role.
- If a private file is ever committed on a branch, squash-merge so it never reaches public history.

## Existing Projects (do not duplicate)

| Project | Repo | data-cat | Notes |
|---|---|---|---|
| Alzheimer's Disease Classification | Alzheimers_Biohermes | research clinical | LEAD, `featured` card, Springer badge |
| Premier League Match Predictor | Football_Match_Predictor | sports | id `proj-fpred`, hero tile links here |
| Fantasy Football AI Planner | Fantasy_Football_AI | sports | |
| Football Transfer Intelligence Agent | Football_Transfer_Intelligence | sports | |
| Validation Procedures in Machine Learning | Final-Year-Project | research sports | BSc dissertation |
| Fever Prediction with Infrared Thermography | Infrared_Thermography | clinical | |
| Pediatric Appendicitis Prediction | Pediatric_Appendicitis | clinical | Live demo |
| YouTube Sentiment Analyser | YouTube_Sentiment_Analyser | nlpcv | `extra` |
| Neural Style Transfer | Generative_AI | nlpcv | `extra` |
| AI Chef Chatbot | AI_Chef | nlpcv | `extra` |
| Amazon RecSys, Retail Prediction, Customer Segmentation | n/a | nlpcv research | "Also built" list (`.extra-mini`) |

---

## Key Links

- Live site: https://EoinHoustoun.github.io
- GitHub Pages repo: https://github.com/EoinHoustoun/EoinHoustoun.github.io
- Springer paper: https://link.springer.com/chapter/10.1007/978-3-031-96235-6_5
- MIT ePortfolio: https://www.mygreatlearning.com/eportfolio/eoin-houstoun

---

## Git Remotes

| Remote | Points to |
|---|---|
| `origin` | https://github.com/EoinHoustoun/Eoin_Houstoun_Portfolio (source/backup) |
| `pages` | https://github.com/EoinHoustoun/EoinHoustoun.github.io (live site) |

Push portfolio changes to both. Use the personal account (EoinHoustoun); see the switching-github-accounts skill.
