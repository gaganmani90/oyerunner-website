---
name: add-race-event
description: Add a new race (e.g. a marathon or 10K event) as its own tab in the Plans section with race-week or countdown plans, or hide a race tab after race day. Use for "add Mumbai Half 2027", "naya race add karo", "remove Navy run tab now".
---

# Race events

Races live in `content/events.yaml`. Each shown race gets a tab between "Free plans" and "Paid coaching", with a countdown, a notice, cards and free downloadable plans.

## Add a race

1. **Collect the facts** (ask for anything missing): race name, date, city/area, which distances get plans, registration status, and whether it should be the featured "Next big one".
   Look up the official date if you can and tell the person the source; never guess a race date.
2. **Add the event** at the end of `content/events.yaml` by copying an existing block:
   ```yaml
   - id: mumbai-half-2027          # lowercase-with-dashes, include the year
     name: Mumbai Half Marathon 2027
     short_name: Mumbai Half       # optional, used in the Goal Finder
     tab_label: Mumbai Half        # keep it short (tab width)
     date: 2027-08-15              # YYYY-MM-DD
     when_where: Sunday 15 August · Mumbai
     notice: …                     # optional yellow note
     after_race: ""                # small text under "Done" after race day
     finder_min_level: 3           # 0-4, see the comment at the top of the file
     featured: false
     show: true
     cards:
       - plan: mumbai-half-2027-21k   # plan file name, see step 3
         big: 21K
         title: Half marathon · 10-week countdown
         text: …
         style: red                   # red or dark
   ```
3. **Add one plan per card** in `content/plans/` (copy a similar race plan such as `tmm-21k.yaml`). Set `event:` to the new event id, give each day a `date:` (e.g. `Mon 7 Jun`) and put the dates in week labels.
   Race-plan training content is coaching work: draft it if asked, but flag that Coach Mayank should review it.
4. **Featured race:** only one event can have `featured: true`. It drives the "Next big one" countdown in Run Club and the race shortcut in the Goal Finder. Moving the flag is fine.
5. Update `content/home.yaml → plans.sub` if it names specific races.
6. `npm run check` (catches missing plans, wrong event ids, two featured races), then preview.

## After a race

Countdowns switch to "Done" by themselves. A week or two after race day, ask whether to hide the tab: set `show: false` (keeps the plans for reference) rather than deleting. If it was featured, move `featured: true` to the next race.
