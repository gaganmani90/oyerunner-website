// Claude Code hook: after Claude edits a file in content/, check all content straight away.
// Problems go back to Claude (exit code 2) so it fixes them before moving on.
import { loadContent, ContentError } from "../src/lib/content.mjs";

let input = "";
for await (const chunk of process.stdin) input += chunk;
let file = "";
try { file = JSON.parse(input || "{}").tool_input?.file_path || ""; } catch {}
if (!/[\\/]content[\\/]/.test(file)) process.exit(0);

try {
  loadContent();
  process.exit(0);
} catch (e) {
  if (e instanceof ContentError) {
    console.error("Content check failed after this edit. Fix these before continuing:\n" + e.problems.map((p) => "• " + p).join("\n"));
    process.exit(2);
  }
  console.error(String(e));
  process.exit(2);
}
