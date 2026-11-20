// npm run pdfs
// Builds one branded PDF per plan into public/pdfs/ from content/plans/*.yaml.
// Runs automatically before "npm run dev" and "npm run build", so PDFs always match the website.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import PDFDocument from "pdfkit";
import { loadContent, DAY_NAMES } from "../src/lib/content.mjs";

const require = createRequire(import.meta.url);
const font = (w) => require.resolve(`@fontsource/jost/files/jost-latin-${w}-normal.woff`);
const OUT = new URL("../public/pdfs/", import.meta.url).pathname;
const FAVICON = fs.readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
const MARK_PATHS = [...FAVICON.matchAll(/<path[^>]*d="([^"]+)"/g)].map((m) => m[1]);
const [VX, VY, , VH] = FAVICON.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);

const C = { red: "#BE2227", ink: "#000000", char: "#5A5856", cream: "#FFF4EC", beige: "#F1E8E2", line: "#E5D8CF", hot: "#BE2227" };
const PAGE = { w: 595.28, h: 841.89, m: 42 };
const W = PAGE.w - PAGE.m * 2;
const BOTTOM = PAGE.h - 56;

const c = loadContent();
const domain = new URL(c.site.url).hostname.replace(/^www\./, "");

function mark(doc, x, y, h, color) {
  const s = h / VH;
  doc.save().translate(x, y).scale(s).translate(-VX, -VY);
  for (const d of MARK_PATHS) doc.path(d).fill(color);
  doc.restore();
}

// Write text with **bold** segments.
function richText(doc, str, x, y, opts) {
  const parts = String(str).split(/(\*\*.+?\*\*)/).filter(Boolean);
  doc.text("", x, y, { ...opts, continued: true });
  parts.forEach((part, i) => {
    const bold = /^\*\*.+\*\*$/.test(part);
    doc.font(bold ? "bold" : "regular").text(bold ? part.slice(2, -2) : part, { ...opts, continued: i < parts.length - 1 });
  });
}

function header(doc, plan) {
  doc.rect(0, 0, PAGE.w, 96).fill(C.red);
  mark(doc, PAGE.m, 24, 48, "#FFFFFF");
  doc.fill("#FFFFFF").font("bold").fontSize(20).text("OYE RUNNER", PAGE.m + 40, 34, { characterSpacing: 0.4, continued: true }).fill(C.ink).text(" .");
  doc.fill("#FFFFFF").font("medium").fontSize(10).text(c.site.tagline.toUpperCase(), PAGE.m + 40, 58, { characterSpacing: 1 });
  const tag = plan.event ? "FREE RACE PLAN" : "FREE PLAN";
  doc.font("semibold").fontSize(10).text(tag, PAGE.m, 40, { width: W, align: "right", characterSpacing: 1 });
  doc.fill(C.ink);
  return 120;
}

function smallHeader(doc, plan) {
  mark(doc, PAGE.m, 26, 18, C.red);
  doc.fill(C.char).font("medium").fontSize(9).text(plan.title, PAGE.m + 18, 31, { width: W - 18 });
  doc.moveTo(PAGE.m, 52).lineTo(PAGE.w - PAGE.m, 52).lineWidth(0.6).stroke(C.line);
  doc.fill(C.ink);
  return 66;
}

function weekBlockHeight(doc, plan, w) {
  let h = 26;
  for (const d of w.days) {
    doc.font("semibold").fontSize(10);
    const th = doc.heightOfString(d.title, { width: W - 86 });
    doc.font("regular").fontSize(9);
    const xh = doc.heightOfString(d.details, { width: W - 86 });
    h += Math.max(th + xh + 10, 26);
  }
  return h + 12;
}

function drawWeek(doc, plan, w, wi, y) {
  doc.roundedRect(PAGE.m, y, W, 24, 6).fill(C.red);
  doc.fill("#FFFFFF").font("bold").fontSize(10.5).text(w.label.toUpperCase(), PAGE.m + 12, y + 7, { width: W - 120, characterSpacing: 0.4 });
  doc.text(`~${Math.round(plan.weeklyKm[wi])} KM`, PAGE.m, y + 7, { width: W - 12, align: "right" });
  y += 26;
  w.days.forEach((d, i) => {
    doc.font("semibold").fontSize(10);
    const th = doc.heightOfString(d.title, { width: W - 86 });
    doc.font("regular").fontSize(9);
    const xh = doc.heightOfString(d.details, { width: W - 86 });
    const rh = Math.max(th + xh + 10, 26);
    if (d.type === "race") doc.rect(PAGE.m, y, W, rh).fill("#F8E4E4");
    doc.fill(C.char).font("bold").fontSize(9.5).text(d.date || DAY_NAMES[i], PAGE.m + 12, y + 6, { width: 66 });
    const hot = ["key", "long", "race"].includes(d.type);
    doc.fill(hot ? C.hot : d.type === "rest" ? C.char : C.ink).font("semibold").fontSize(10).text(d.title, PAGE.m + 80, y + 5, { width: W - 86 });
    doc.fill(C.char).font("regular").fontSize(9).text(d.details, PAGE.m + 80, doc.y + 1, { width: W - 86 });
    y += rh;
    doc.moveTo(PAGE.m, y).lineTo(PAGE.w - PAGE.m, y).lineWidth(0.5).stroke(C.line);
  });
  doc.fill(C.ink);
  return y + 12;
}

function makePdf(plan) {
  const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true, info: { Title: plan.pdf_name, Author: `${c.site.name} · Coach ${c.site.coach.name}`, Subject: plan.subtitle } });
  doc.registerFont("regular", font(400));
  doc.registerFont("medium", font(500));
  doc.registerFont("semibold", font(600));
  doc.registerFont("bold", font(700));
  doc.registerFont("black", font(800));

  // Cover block
  let y = header(doc, plan);
  doc.fill(C.ink).font("black").fontSize(24).text(plan.title, PAGE.m, y, { width: W });
  doc.fill(C.char).font("medium").fontSize(11.5).text(plan.subtitle, PAGE.m, doc.y + 4, { width: W });
  y = doc.y + 10;
  const pills = [`${plan.nWeeks} week${plan.nWeeks === 1 ? "" : "s"}`, `Peak ~${plan.peakKm} km/week`, `Total ~${plan.totalKm} km`];
  let px = PAGE.m;
  doc.font("semibold").fontSize(9.5);
  pills.forEach((t, i) => {
    const pw = doc.widthOfString(t) + 20;
    doc.roundedRect(px, y, pw, 20, 10).fill(i === 0 ? C.red : C.beige);
    doc.fill(i === 0 ? "#FFFFFF" : C.ink).text(t, px + 10, y + 5.5);
    px += pw + 6;
  });
  y += 32;
  for (const [label, val] of [["Who it's for.", plan.who_its_for], ["Start only if.", plan.start_only_if]]) {
    doc.fill(C.ink);
    richText(doc, `**${label}** ${val}`, PAGE.m, y, { width: W, lineGap: 1.5 });
    doc.fontSize(10.5);
    y = doc.y + 6;
  }
  doc.fontSize(10.5);
  y += 8;

  // Weeks
  plan.weeks.forEach((w, wi) => {
    const need = weekBlockHeight(doc, plan, w);
    if (y + need > BOTTOM) { doc.addPage(); y = smallHeader(doc, plan); }
    y = drawWeek(doc, plan, w, wi, y);
  });

  // Guide pages
  doc.addPage(); y = smallHeader(doc, plan);
  doc.fill(C.ink).font("black").fontSize(20).text("How to use this plan", PAGE.m, y, { width: W });
  y = doc.y + 10;
  for (const s of c.pdfGuide.sections) {
    if (y > BOTTOM - 80) { doc.addPage(); y = smallHeader(doc, plan); }
    doc.fill(C.red).font("bold").fontSize(12.5).text(s.heading, PAGE.m, y, { width: W });
    y = doc.y + 4;
    for (const pt of s.points) {
      doc.circle(PAGE.m + 3, y + 6, 2.2).fill(C.red);
      doc.fill(C.char).fontSize(10.5);
      richText(doc, pt, PAGE.m + 14, y, { width: W - 14, lineGap: 1.5 });
      y = doc.y + 4;
    }
    y += 10;
  }
  if (y > BOTTOM - 120) { doc.addPage(); y = smallHeader(doc, plan); }
  doc.roundedRect(PAGE.m, y, W, 1, 0).fill(C.line);
  y += 12;
  doc.fill(C.ink).fontSize(10);
  richText(doc, c.home.footer.disclaimer, PAGE.m, y, { width: W, lineGap: 1.5 });
  y = doc.y + 14;
  if (c.pdfGuide.closing) {
    doc.fill(C.red).font("bold").fontSize(12).text(c.pdfGuide.closing, PAGE.m, y, { width: W });
  }

  // Footer on every page
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i++) {
    doc.switchToPage(i);
    doc.fill(C.char).font("medium").fontSize(8.5).text(
      `${c.site.name} · ${domain} · @${c.site.contact.instagram_handle} · ${c.site.contact.email}`,
      PAGE.m, PAGE.h - 34, { width: W - 60, lineBreak: false },
    );
    doc.text(`${i + 1} / ${range.count}`, PAGE.m, PAGE.h - 34, { width: W, align: "right", lineBreak: false });
  }
  return doc;
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".pdf")) fs.unlinkSync(path.join(OUT, f));
await Promise.all(
  c.plans.map(
    (plan) =>
      new Promise((resolve, reject) => {
        const doc = makePdf(plan);
        const stream = fs.createWriteStream(path.join(OUT, plan.id + ".pdf"));
        stream.on("finish", resolve).on("error", reject);
        doc.pipe(stream);
        doc.end();
      }),
  ),
);
console.log(`✓ Made ${c.plans.length} plan PDFs in public/pdfs/`);
