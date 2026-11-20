---
name: preview-and-publish
description: Show the Oye Runner website with the latest changes, then put them live. Use for "dikhao", "preview", "how does it look", "publish", "live karo", "make it live", "push the changes".
---

# Preview, then publish

## Preview

1. `npm run check` must say "All good".
2. Start the preview in the background: `npm run dev` (it also rebuilds the plan PDFs). The site is at http://localhost:4321.
3. If you have a browser tool, open the page, go to the changed section and take a screenshot to show the person. Otherwise tell them to open http://localhost:4321 in their browser.
4. Note: the "Start with Oye Runner" form shows "Preview only" on localhost. That's expected; it sends for real on the live site.

## Publish

Only when the person clearly says to publish.

1. `git pull --rebase` first (someone else may have changed the site).
2. `npm run build`. If it fails, fix it; don't publish a broken build.
3. Add a dated line to `CHANGELOG.md` describing the change in plain words.
4. `git status` and `git diff --stat`: make sure only expected files changed (normally `content/…`, `CHANGELOG.md`, maybe `public/images/…`). Never commit `dist/`, `public/pdfs/`, `node_modules/` or any `.env` file.
5. Commit with a plain message, e.g. `Content: TMM 42K week 5 long run 26 → 28 km`.
6. `git push origin main`.
7. Tell the person: "Published. The live site updates in about 2 minutes." If you can, check the run with `gh run list --limit 1` and confirm it passed.

## If the online check fails

The live site stays on the previous version. Run `gh run view --log-failed` (if `gh` is available) or `npm run build` locally, fix the problem, and push again. Explain what went wrong in one plain sentence.

## Undo a published change

`git revert <commit>` then push (never force-push). Confirm with the person first which change to undo; `git log --oneline -10` lists recent ones.
