# Oye Runner website

Free running plans, race plans and customised coaching by **Coach Mayank Mani Kaushik**, ACSM-Certified Marathon Coach.
Live at **oyerunner.com**.

This project is set up to be **maintained by talking to Claude**. Day-to-day changes (prices, plans, races, text, UPI ID)
don't need a developer: see **[MAINTAINING.md](MAINTAINING.md)**.

## How it's built

```
content/            ← everything you can edit: words, prices, plans, races, FAQ, UPI ID
  site.yaml           contact details, coach, payments
  home.yaml           page text, top to bottom
  pricing.yaml        Paid coaching tab
  events.yaml         race tabs (Navy Run, TMM 2027…)
  plans/*.yaml        one file per training plan (20 today)
  benefits.yaml, faq.yaml, pdf-guide.yaml
public/             ← logo, app icons, photos (public/images/)
src/                ← page layout, styles and behaviour (developer area)
scripts/            ← content checker, PDF maker, icon maker, Claude hook
.claude/            ← instructions and skills Claude uses to maintain the site
CLAUDE.md           ← rules Claude follows in this project
```

- **Astro** static site. No server, no database.
- Every file in `content/` is checked against strict rules before each preview and publish
  (`npm run check`): a typo in a field name, a price written as text or a broken plan stops the
  build with a plain-English message instead of breaking the live site.
- Plan PDFs, weekly totals, QR codes and countdowns are generated from the content files, so they never go out of sync.

## Run it

Needs Node.js 22 or newer.

```bash
npm install
npm run dev        # preview at http://localhost:4321
npm run check      # check content only
npm run build      # full site in dist/
```

## Publishing

Every push to `main` runs `.github/workflows/deploy.yml`: it checks the content, builds and publishes to GitHub Pages.
There is no pull-request step; work is committed straight to `main`. If the check fails, nothing is published.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
For the custom domain, add `oyerunner.com` under **Settings → Pages → Custom domain** and point the domain's DNS at GitHub Pages.

## Features

- Plans hub with **Free plans / race tabs / Paid coaching** tabs, week-by-week plan browser, free PDF downloads (details captured first).
- **Pay by UPI** on every paid option (QR code on computers, "Open UPI app" on phones, UTR captured after payment). Switched on by setting `payments.upi_id` in `content/site.yaml`.
- Goal Finder: picks the right free plan from goal, level, age, 5K time and race date; shows heart-rate zones and paces.
- "Start with Oye Runner" lead form → emails oyerunner@gmail.com via FormSubmit.
- Installable as a phone app (web app manifest).
