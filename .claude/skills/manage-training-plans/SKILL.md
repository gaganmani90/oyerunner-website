---
name: manage-training-plans
description: Edit, add or retire an Oye Runner training plan (free 5K/10K/21K/42K plans or race plans), including its weekly sessions and PDF. Use for "week 3 ka long run 12 km karo", "add a 10-week 10K plan", "fix a typo in the half marathon plan", "remove the 4-week 5K plan".
---

# Training plans

Each plan is one file in `content/plans/`. The file name is the plan ID.

- Free plans: `int-<distance>-<weeks>.yaml` (intermediate) and `beg-<distance>.yaml` (beginner).
- Race plans: `<event>-<distance>.yaml`, e.g. `tmm-42k.yaml`, linked to a race in `content/events.yaml`.

## File layout

```yaml
title: 10K Intermediate · 8-Week Plan
subtitle: 8 weeks · 4-5 run days + 2 strength
level: intermediate        # free plans: intermediate or beginner
# event: tmm-2027          # race plans use event instead of level (never both)
distance: 10k              # 5k, 10k, 21k or 42k
who_its_for: …
start_only_if: …
pdf_name: Oye Runner 10K Intermediate - 8-Week Plan    # file name people get when downloading
weeks:
  - label: Week 1
    days:                  # Monday to Sunday, 7 days
      - type: rest         # rest | easy | key | long | race | strength
        title: Rest
        details: Full rest. Walk, stretch, sleep 7-9 hours.
        km: 0
```

Weekly km, peak km, total km, the number of weeks and the PDF are all **worked out automatically**. Only change `km:` on the days.

## Edit a session

1. Open the plan (ask which plan if unclear; the Free plans tab shows Level · Distance · Weeks).
2. Find the week by its `label`, then the day (7 days in order Mon→Sun).
3. Change `title`, `details` and/or `km`. If the distance in the text changes ("9 km easy" → "10 km easy"), update `km` to match.
4. `npm run check`, then tell the person what changed, e.g. "10K 8-week plan, Week 3 Sunday long run: 11 km → 12 km. Weekly total now ~37 km."

Same session in many plans? (e.g. Strength A wording) Use `grep -rln "text" content/plans/` and offer to update all of them.

## Add a free plan

1. Copy the closest existing plan to a new file name following the pattern (e.g. `int-10k-10.yaml`).
2. Update `title`, `subtitle`, `pdf_name` and the weeks. Each week needs 7 days.
3. The Free plans tab picks it up automatically: a new "10 weeks" chip appears for Intermediate · 10K. The Goal Finder also uses it.
4. Update the count in `content/home.yaml → hero.proof` ("20 free plans") if it changes.

Writing a new plan's training content is coaching work: draft it if asked, but say clearly that Coach Mayank should review it before it goes live.

## Retire a plan

Delete the file only after confirming. Then run `npm run check`: it tells you if an event card still points at it. Update "20 free plans" in `content/home.yaml` if the count changes.

## PDFs

`npm run pdfs` rebuilds every PDF from the plan files (runs automatically before preview and publish). The design is in `scripts/make-pdfs.mjs`; the "How to use this plan" pages come from `content/pdf-guide.yaml`.
