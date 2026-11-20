// npm run check
// Checks every file in content/ and prints either "All good" or a list of problems to fix.
import { loadContent, ContentError } from "../src/lib/content.mjs";

try {
  const c = loadContent();
  const freePlans = c.plans.filter((p) => p.level).length;
  console.log(
    `✓ All good. ${c.plans.length} plans (${freePlans} free, ${c.plans.length - freePlans} race), ` +
      `${c.events.length} event tab(s), ${c.pricing.one_time.items.length + c.pricing.subscriptions.items.length} paid options, ` +
      `${c.faq.length} FAQs. UPI payments: ${c.upiEnabled ? "ON (" + c.site.payments.upi_id + ")" : "off (no UPI ID in content/site.yaml)"}.`,
  );
} catch (e) {
  if (e instanceof ContentError) {
    console.error(`✗ Found ${e.problems.length} problem(s) in content/. Nothing was published.\n`);
    for (const p of e.problems) console.error("  • " + p);
    console.error("");
    process.exit(1);
  }
  throw e;
}
