// Loads every file in content/, checks it against the rules below, and
// returns one object the site, the PDF maker and the checker all share.
// If something is wrong, it throws a ContentError listing every problem
// in plain words, with the file and the exact field.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { z } from "zod";

// Find the project folder (the one holding content/site.yaml), wherever this file runs from.
function findRoot() {
  for (const start of [path.dirname(fileURLToPath(import.meta.url)), process.cwd()]) {
    let dir = start;
    while (true) {
      if (fs.existsSync(path.join(dir, "content", "site.yaml"))) return dir;
      const up = path.dirname(dir);
      if (up === dir) break;
      dir = up;
    }
  }
  throw new Error("Can't find the content/ folder (looked for content/site.yaml).");
}
const ROOT = findRoot();
export const CONTENT_DIR = path.join(ROOT, "content");

export class ContentError extends Error {
  constructor(problems) {
    super("Content problems:\n" + problems.map((p) => "  • " + p).join("\n"));
    this.problems = problems;
  }
}

/* ───────────── rules (schemas) ───────────── */

const text = z.string().trim().min(1, "can't be empty");
const optText = z.string().optional().default("");
const link = z.string().regex(/^(https?:\/\/|#|\/)/, "must start with https://, # or /");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be a date like 2027-01-17");
const titled = z.strictObject({ title: text, text: text });

const SiteSchema = z.strictObject({
  name: text,
  tagline: text,
  url: z.string().regex(/^https?:\/\//, "must start with https://"),
  seo: z.strictObject({ title: text, description: text, share_description: text }),
  coach: z.strictObject({ name: text, short_name: text, credential: text, photo: optText }),
  contact: z.strictObject({
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "isn't a valid email address"),
    instagram_url: link,
    instagram_handle: text,
  }),
  run_club_city: text,
  lead_form_endpoint: z.string().regex(/^https:\/\//, "must start with https://").or(z.literal("")),
  payments: z.strictObject({
    upi_id: z
      .string()
      .trim()
      .regex(/^$|^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/, "isn't a valid UPI ID (it should look like name@okhdfcbank)"),
    payee_name: text,
  }),
});

const PriceItem = z.strictObject({
  name: text,
  duration: optText,
  price: z.number({ error: "must be a number like 2499 (no commas, no Rs.)" }).int().positive(),
  per: z.enum(["month", "year"]).optional(),
  tag: optText,
  featured: z.boolean().optional().default(false),
  features: z.array(text).min(1),
  request: text,
});
const PricingSchema = z.strictObject({
  one_time: z.strictObject({ heading: text, button: text, items: z.array(PriceItem).min(1) }),
  subscriptions: z.strictObject({ heading: text, button: text, items: z.array(PriceItem).min(1) }),
  note: text,
  note_with_upi: text,
});

const BenefitsSchema = z
  .array(z.strictObject({ title: text, text: text, fact: text, reel: z.string().regex(/^$|^https:\/\//, "must be empty or a https:// link") }))
  .min(1);

const FaqSchema = z.array(z.strictObject({ q: text, a: text })).min(1);

const EventSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/, "use lowercase letters, numbers and dashes only"),
  name: text,
  short_name: optText,
  tab_label: text,
  date: isoDate,
  when_where: text,
  notice: optText,
  after_race: optText,
  finder_min_level: z.number().int().min(0).max(4),
  featured: z.boolean().optional().default(false),
  featured_text: optText,
  show: z.boolean().optional().default(true),
  cards: z
    .array(z.strictObject({ plan: text, big: text, title: text, text: text, style: z.enum(["red", "dark"]).default("dark") }))
    .min(1),
});
const EventsSchema = z.array(EventSchema);

const DAY_TYPES = ["rest", "easy", "key", "long", "race", "strength"];
const PlanSchema = z
  .strictObject({
    title: text,
    subtitle: text,
    level: z.enum(["intermediate", "beginner"]).optional(),
    event: z.string().optional(),
    distance: z.enum(["5k", "10k", "21k", "42k"]),
    who_its_for: text,
    start_only_if: text,
    pdf_name: text,
    weeks: z
      .array(
        z.strictObject({
          label: text,
          days: z
            .array(
              z.strictObject({
                date: z.string().optional(),
                type: z.enum(DAY_TYPES, { error: "must be one of: " + DAY_TYPES.join(", ") }),
                title: text,
                details: text,
                km: z.number({ error: "must be a number (use 0 for rest days)" }).min(0).max(60),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  })
  .refine((p) => !!p.level !== !!p.event, { message: 'needs either "level" (free plan) or "event" (race plan), not both' });

const CoachTipsSchema = z.array(
  z.strictObject({
    title: text,
    reel: z.string().regex(/^https:\/\/(www\.)?instagram\.com\//, "must be an Instagram link starting with https://www.instagram.com/"),
    intro: optText,
    points: z.array(text).min(1),
    closing: optText,
  }),
);

const PdfGuideSchema = z.strictObject({
  sections: z.array(z.strictObject({ heading: text, points: z.array(text).min(1) })),
  closing: optText,
});

const line = z.string();
const HomeSchema = z.strictObject({
  nav: z.array(z.strictObject({ label: text, href: link })),
  start_button: text,
  hero: z.strictObject({
    eyebrow: text,
    title_lines: z.array(text).min(1),
    lede: text,
    primary_button: text,
    proof: z.array(titled),
  }),
  why: z.strictObject({ eyebrow: text, heading: text, sub: line }),
  plans: z.strictObject({ eyebrow: text, heading: text, sub: line, free_tab: text, paid_tab: text, plan_inside: text }),
  finder: z.strictObject({ eyebrow: text, heading: text, sub: line }),
  coach: z.strictObject({ eyebrow: text, heading: text, paragraphs: z.array(text), principles: z.array(titled) }),
  tips: z.strictObject({ eyebrow: text, heading: text, sub: line }),
  club: z.strictObject({
    eyebrow: text,
    heading: text,
    sub: line,
    card_heading: text,
    card_text: text,
    schedule: z.array(z.strictObject({ label: text, value: text })),
    join_button: text,
  }),
  start: z.strictObject({ eyebrow: text, heading: text, sub: line, steps: z.array(text) }),
  app: z.strictObject({
    eyebrow: text,
    heading: text,
    sub: line,
    iphone_steps: z.array(text),
    android_text: text,
    install_button: text,
  }),
  faq: z.strictObject({ heading: text }),
  footer: z.strictObject({ tagline: text, disclaimer: text }),
  start_form: z.strictObject({
    runner_types: z.array(text).min(1),
    requests: z.array(text).min(1),
    message_placeholder: line,
    consent: text,
  }),
});

/* ───────────── loading ───────────── */

function readYaml(rel, problems) {
  const file = path.join(CONTENT_DIR, rel);
  if (!fs.existsSync(file)) {
    problems.push(`content/${rel}: file is missing`);
    return undefined;
  }
  const doc = YAML.parseDocument(fs.readFileSync(file, "utf8"), { prettyErrors: true });
  if (doc.errors.length) {
    for (const e of doc.errors) problems.push(`content/${rel}: the file layout is broken near line ${e.linePos?.[0]?.line ?? "?"} (${e.message.split("\n")[0]}). Check indentation and quotes.`);
    return undefined;
  }
  return doc.toJS();
}

function check(schema, data, rel, problems) {
  if (data === undefined) return undefined;
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  for (const issue of r.error.issues) {
    let where = issue.path.length ? " → " + issue.path.map((k) => (typeof k === "number" ? `[${k + 1}]` : k)).join(".").replace(/\.\[/g, "[") : "";
    let msg = issue.message;
    if (issue.code === "unrecognized_keys") msg = `unknown field ${issue.keys.map((k) => `"${k}"`).join(", ")} (typo?)`;
    if (issue.code === "invalid_type" && /undefined/.test(msg)) msg = "is missing";
    else if (issue.code === "invalid_type" && /expected string, received object/.test(msg))
      msg = 'this text contains ": " (a colon and a space). Wrap the whole text in "double quotes"';
    problems.push(`content/${rel}${where}: ${msg}`);
  }
  return undefined;
}

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Load, validate and enrich all content. Throws ContentError on any problem. */
export function loadContent() {
  const problems = [];
  const site = check(SiteSchema, readYaml("site.yaml", problems), "site.yaml", problems);
  const home = check(HomeSchema, readYaml("home.yaml", problems), "home.yaml", problems);
  const pricing = check(PricingSchema, readYaml("pricing.yaml", problems), "pricing.yaml", problems);
  const benefits = check(BenefitsSchema, readYaml("benefits.yaml", problems), "benefits.yaml", problems);
  const faq = check(FaqSchema, readYaml("faq.yaml", problems), "faq.yaml", problems);
  const events = check(EventsSchema, readYaml("events.yaml", problems), "events.yaml", problems);
  const pdfGuide = check(PdfGuideSchema, readYaml("pdf-guide.yaml", problems), "pdf-guide.yaml", problems);
  const coachTips = check(CoachTipsSchema, readYaml("coach-tips.yaml", problems), "coach-tips.yaml", problems);

  const plans = [];
  const planDir = path.join(CONTENT_DIR, "plans");
  for (const f of fs.readdirSync(planDir).filter((f) => f.endsWith(".yaml")).sort()) {
    const id = f.replace(/\.yaml$/, "");
    if (!/^[a-z0-9-]+$/.test(id)) problems.push(`content/plans/${f}: file name must use lowercase letters, numbers and dashes only`);
    const p = check(PlanSchema, readYaml("plans/" + f, problems), "plans/" + f, problems);
    if (!p) continue;
    p.weeks.forEach((w, i) => {
      if (!w.days.some((d) => d.date) && w.days.length !== 7)
        problems.push(`content/plans/${f} → weeks[${i + 1}] (${w.label}): has ${w.days.length} days, needs 7 (Monday to Sunday). Only race plans with "date:" on each day can have fewer.`);
    });
    const weeklyKm = p.weeks.map((w) => Math.round(w.days.reduce((a, d) => a + d.km, 0) * 10) / 10);
    plans.push({
      ...p,
      id,
      group: p.level ?? p.event,
      nWeeks: p.weeks.length,
      weeklyKm,
      peakKm: Math.round(Math.max(...weeklyKm)),
      totalKm: Math.round(weeklyKm.reduce((a, b) => a + b, 0)),
      pdf: `pdfs/${id}.pdf`,
    });
  }

  /* cross-file rules */
  const planById = Object.fromEntries(plans.map((p) => [p.id, p]));
  if (events) {
    const ids = new Set();
    for (const e of events) {
      if (ids.has(e.id)) problems.push(`content/events.yaml: the id "${e.id}" is used twice`);
      ids.add(e.id);
      for (const c of e.cards) {
        const p = planById[c.plan];
        if (!p) problems.push(`content/events.yaml → ${e.id} card "${c.title}": plan "${c.plan}" doesn't exist in content/plans/`);
        else if (p.event !== e.id) problems.push(`content/plans/${c.plan}.yaml: set event: ${e.id} (it's shown on the ${e.tab_label} tab)`);
      }
    }
    for (const p of plans) if (p.event && !ids.has(p.event)) problems.push(`content/plans/${p.id}.yaml: event "${p.event}" isn't in content/events.yaml`);
    const featured = events.filter((e) => e.show && e.featured);
    if (featured.length > 1) problems.push(`content/events.yaml: only one event can be featured (now: ${featured.map((e) => e.id).join(", ")})`);
  }
  if (pricing && home) {
    for (const it of [...pricing.one_time.items, ...pricing.subscriptions.items])
      if (!home.start_form.requests.includes(it.request))
        problems.push(`content/pricing.yaml → "${it.name}": request "${it.request}" must match one of start_form.requests in content/home.yaml`);
  }
  if (!plans.some((p) => p.level === "intermediate" && p.distance === "10k")) problems.push("content/plans: the Free plans tab opens on Intermediate 10K, so at least one intermediate 10k plan must exist");

  if (problems.length) throw new ContentError(problems);

  const shownEvents = events.filter((e) => e.show);
  return {
    site,
    home,
    pricing,
    benefits,
    faq,
    pdfGuide,
    coachTips,
    allEvents: events,
    events: shownEvents,
    featuredEvent: shownEvents.find((e) => e.featured) ?? null,
    plans,
    planById,
    upiEnabled: !!site.payments.upi_id,
  };
}

/* ───────────── small helpers shared by pages and scripts ───────────── */

/** "24999" → "24,999" (Indian grouping) */
export const rupees = (n) => Number(n).toLocaleString("en-IN");

/** Price label used in forms and UPI notes, e.g. "Annual coaching · Rs. 24,999/year" */
export const priceLabel = (it) => `${it.name} · Rs. ${rupees(it.price)}${it.per ? "/" + it.per : ""}`;

/** UPI payment link for an amount. Opens GPay/PhonePe/Paytm on phones. */
export function upiLink(payments, amount, note) {
  const enc = (s) => encodeURIComponent(s).replace(/%40/g, "@");
  const q = { pa: payments.upi_id, pn: payments.payee_name, am: Number(amount).toFixed(2), cu: "INR", tn: note.slice(0, 50) };
  return "upi://pay?" + Object.entries(q).map(([k, v]) => k + "=" + enc(v)).join("&");
}

/** Heading with the brand dot: "Better together." → Better together<span class="dot">.</span> */
export function heading(s) {
  const t = String(s).trim();
  const last = t.slice(-1);
  return /[.?!]/.test(last) ? rich(t.slice(0, -1)) + `<span class="dot">${last}</span>` : rich(t);
}

/** Escape text for HTML, then turn **bold** into <strong>bold</strong>. */
export function rich(s) {
  const esc = String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
