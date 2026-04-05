import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const detailPath = path.join(dirname, "ContentDetailSheet.js");
const headerSource = readFileSync(path.join(dirname, "PremiumHeader.js"), "utf8");

test("shared content detail sheet exists with the expected full-screen reading contract", () => {
  assert.equal(existsSync(detailPath), true);

  const source = readFileSync(detailPath, "utf8");
  assert.equal(source.includes("closeLabel = 'Close details'"), true);
  assert.equal(source.includes("accessibilityLabel={closeLabel}"), true);
  assert.equal(source.includes("metadataItems"), true);
  assert.equal(source.includes("sections = []"), true);
  assert.equal(source.includes("section.title"), true);
  assert.equal(source.includes("`${section.title}-${item.label}-${item.value}`"), true);
  assert.equal(source.includes("body || 'No details available.'"), true);
});

test("premium header uses safe-area spacing so the top controls sit lower on device", () => {
  assert.equal(headerSource.includes("useSafeAreaInsets"), true);
  assert.equal(headerSource.includes("paddingTop: insets.top + spacing.sm"), true);
});
