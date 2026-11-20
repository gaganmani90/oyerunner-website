---
name: update-site-content
description: Change any text, contact detail, photo, Instagram reel link or FAQ on the Oye Runner website. Use for requests like "change the email", "update the coach bio", "add an FAQ", "add a reel to the heart card", "put Mayank's photo".
---

# Update site content

All words on the site live in `content/`. Find the right file with the map in `CLAUDE.md`, edit it, and check.

## Steps

1. **Find the text.** Search for a few words of what the person quoted: `grep -rn "words they quoted" content/`.
2. **Edit in place.** Keep the YAML layout (same indentation, `- ` for list items).
   - Text containing `: ` (colon + space) or starting with a quote must be wrapped in "double quotes".
   - `**word**` makes a word bold. Headings ending in `.` or `?` get the red brand dot automatically.
3. **Check.** The content check runs automatically after your edit. If it reports a problem, fix it. Or run `npm run check`.
4. **Tell the person** in one line what changed and where it appears, then offer a preview (see `preview-and-publish`).

## Common requests

- **Contact email:** `content/site.yaml → contact.email`. Also update `lead_form_endpoint` (the address at the end of the FormSubmit link) and any mention in `content/home.yaml → start.steps`. Warn the person: FormSubmit sends a one-time "activate" email to the new address; they must click it once.
- **Instagram:** `content/site.yaml → contact.instagram_url` and `instagram_handle` (without @).
- **Coach photo:** save the image as `public/images/coach.jpg` (ask them to attach it; portrait, at least 800 px wide), then set `content/site.yaml → coach.photo: /images/coach.jpg`.
- **Reel on a "Why run" card:** paste the Instagram reel link into `reel:` of that card in `content/benefits.yaml`. A "Watch the reel" button appears.
- **Coach's corner reel:** copy a block in `content/coach-tips.yaml`: `title`, `reel` (Instagram link), `intro`, 2-6 `points`, optional `closing`. Write the points from the reel's caption in the coach's voice. Delete a block to remove a reel; with none left, the section hides.
- **FAQ:** add `- q: …` / `  a: …` in `content/faq.yaml`. Order in the file = order on the site.
- **Run club city / schedule:** `content/site.yaml → run_club_city`; schedule rows in `content/home.yaml → club.schedule`.
- **Menu links:** `content/home.yaml → nav` (only `#why`, `#plans`, `#finder`, `#coach`, `#tips`, `#club`, `#app`, `#faq`, `#start` exist on the page).

## Don't

- Don't edit files in `src/` for a text change.
- Don't change the safety disclaimer or health-check wording without the coach's OK.
