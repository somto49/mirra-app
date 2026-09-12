// scripts/verify-garments.js
// Run with: npm run verify-garments
// Checks that every outfit ID has a valid GARMENT_IMAGES entry, a valid
// GARMENT_TYPES entry, and that the image URL actually resolves.
//
// Imports from ../garments.js — the same file server.js uses — so this
// test can never drift out of sync with what's actually deployed.

import fetch from "node-fetch";
import { GARMENT_IMAGES, GARMENT_TYPES, ALL_OUTFIT_IDS } from "../garments.js";

const VALID_TYPES = new Set(["upper_body", "lower_body", "dresses"]);

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return { ok: true };
    const getRes = await fetch(url, { method: "GET" });
    return { ok: getRes.ok, status: getRes.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log(`Checking ${ALL_OUTFIT_IDS.length} outfit IDs...\n`);
  let failures = 0;

  for (const id of ALL_OUTFIT_IDS) {
    const url = GARMENT_IMAGES[id];
    const type = GARMENT_TYPES[id];
    const problems = [];

    if (!url) problems.push("missing GARMENT_IMAGES entry");
    if (!type) problems.push("missing GARMENT_TYPES entry");
    if (type && !VALID_TYPES.has(type)) problems.push(`invalid type "${type}"`);

    let urlStatus = "skipped (no URL)";
    if (url) {
      const result = await checkUrl(url);
      urlStatus = result.ok ? "reachable ✅" : `UNREACHABLE ❌ (${result.status || result.error})`;
      if (!result.ok) problems.push("image not reachable");
    }

    const pass = problems.length === 0;
    if (!pass) failures++;

    console.log(
      `${pass ? "✅" : "❌"} ${id.padEnd(14)} type=${(type || "—").padEnd(11)} url=${urlStatus}` +
      (problems.length ? `\n    ⚠ ${problems.join(", ")}` : "")
    );
  }

  console.log(`\n${ALL_OUTFIT_IDS.length - failures}/${ALL_OUTFIT_IDS.length} outfits ready. ${failures} need fixing before redeploy.`);
  process.exit(failures > 0 ? 1 : 0);
}

main();
