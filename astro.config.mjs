// Astro settings. The maintainer never needs to change this file.
// SITE_URL / SITE_BASE are set automatically by the GitHub Pages workflow;
// locally they default to the live domain and "/".
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.SITE_URL || "https://www.oyerunner.com",
  base: process.env.SITE_BASE || "/",
  output: "static",
  trailingSlash: "ignore",
  build: { format: "directory" },
  devToolbar: { enabled: false },
});
