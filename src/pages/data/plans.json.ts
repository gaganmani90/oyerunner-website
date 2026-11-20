// Publishes every training plan as /data/plans.json for the Plans tabs and Goal Finder.
import { loadContent } from "../../lib/content.mjs";

export function GET() {
  const { plans } = loadContent();
  const out = plans.map((p) => ({
    id: p.id,
    group: p.group,
    level: p.level ?? null,
    event: p.event ?? null,
    distance: p.distance,
    title: p.title,
    subtitle: p.subtitle,
    who: p.who_its_for,
    prereq: p.start_only_if,
    nWeeks: p.nWeeks,
    peakKm: p.peakKm,
    pdf: p.pdf,
    pdfName: p.pdf_name + ".pdf",
    weeks: p.weeks.map((w, i) => ({ label: w.label, km: p.weeklyKm[i], days: w.days })),
  }));
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
}
