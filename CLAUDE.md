# Oye Runner website · instructions for Claude

This is the website for **Oye Runner**, Coach Mayank Mani Kaushik's running coaching brand
(free training plans, race plans, paid coaching). Live address: oyerunner.com.

## Who you're working with

The person asking you for changes is usually **not a developer**. They may write in English or
Hinglish ("price badha do", "naya race add karo"). So:

- Reply in plain, friendly language, in the language they use. No jargon (say "the prices file", not "pricing.yaml schema").
- Don't ask them to run commands or edit files. You do it.
- After every change, tell them in one or two lines **what changed and where it shows on the site**.
- If a request is unclear or could change something important (prices, deleting a plan, the UPI ID), confirm first in one short question.

## The golden rule: content vs code

| What | Where | Who changes it |
|---|---|---|
| All words, prices, plans, races, FAQ, contact details, UPI ID | `content/` (YAML files with comments) | You, freely, when asked |
| Photos | `public/images/` | You, when asked |
| Layout, colours, behaviour | `src/`, `scripts/`, `astro.config.mjs` | Only when the request clearly needs a design or feature change. Say so first. |

Almost every request is a `content/` edit. Read the comments at the top of each content file: they explain every field.

## Map: page section → file

| On the site | File |
|---|---|
| Contact email, Instagram, UPI ID, coach name/photo, run club city | `content/site.yaml` |
| Hero, Why run heading, Coach bio, Run Club, Start band, App, footer, form options | `content/home.yaml` |
| "Six reasons to start" cards + Instagram reel links | `content/benefits.yaml` |
| Paid coaching tab: prices, features | `content/pricing.yaml` |
| Race tabs (Navy Run, TMM 2027…) and countdowns | `content/events.yaml` |
| Every training plan (free + race), one file each | `content/plans/<plan-id>.yaml` |
| Extra "How to use this plan" pages inside the PDFs | `content/pdf-guide.yaml` |
| FAQ | `content/faq.yaml` |

Weekly km, peak km, total km, plan PDFs, QR codes and countdowns are **calculated automatically**. Never type them in.

## Every time you change something

1. Make the edit in `content/`.
2. `npm run check` runs automatically after each content edit (hook). If it reports a problem, fix it before doing anything else. You can also run it yourself.
3. For anything visible, run `npm run build` to be sure the site builds.
4. Offer a preview: `npm run dev` then open http://localhost:4321 (use a browser tool if you have one; take a screenshot for the person).
5. Add a line to `CHANGELOG.md` (date, what changed, in plain words).
6. Publish only when the person says so (see the `preview-and-publish` skill). Publishing = commit + `git push` to `main`; GitHub then checks and deploys the site in about 2 minutes. If the check fails online, the live site stays as it was.

## Skills in this project

- `update-site-content`: any text, contact detail, photo, reel link or FAQ change.
- `manage-prices-and-upi`: change prices, add/remove a paid option, set or change the UPI ID.
- `manage-training-plans`: edit a plan, add a new free plan, retire one.
- `add-race-event`: add a new race tab with its plans, or hide one after race day.
- `preview-and-publish`: show the change, then put it live.

## Don'ts

- Don't rename plan files: the file name is the plan's ID (used in links and PDFs).
- Don't put payment details other than the UPI ID anywhere, and never put passwords, API keys or bank account numbers in this repo.
- Don't `git push --force`, rewrite history or delete branches.
- Don't change medical/safety wording (`footer.disclaimer`, Goal Finder health check) without the coach's approval.
- Don't commit `dist/` or `public/pdfs/` (they're generated).

## Tech notes (for you, not the maintainer)

- Astro 7 static site, Node 22+. `npm run dev` / `npm run build` both run `check` and `pdfs` first.
- `src/lib/content.mjs` loads + validates all content (zod, strict: unknown fields are errors) and is shared by the site, `scripts/make-pdfs.mjs` and `scripts/check-content.mjs`. New content fields need a schema change there.
- Client behaviour (tabs, week browser, Goal Finder, lead form, UPI sheet): `src/scripts/site.js`. Plans load from `/data/plans.json` (built by `src/pages/data/plans.json.ts`).
- Lead form posts to FormSubmit (`site.yaml → lead_form_endpoint`). It only works on a real web address, not on localhost previews.
- Deploy: `.github/workflows/deploy.yml` (GitHub Pages). `SITE_BASE` is set from the Pages config, so all links must use `import.meta.env.BASE_URL` / `CFG.base`.
