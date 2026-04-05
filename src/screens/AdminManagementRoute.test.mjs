import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const source = readFileSync(path.join(dirname, "AdminShellScreen.js"), "utf8");

test("admin management tab renders a dedicated management screen", () => {
  assert.equal(
    source.includes("import { AdminManagementScreen } from './admin/AdminManagementScreen';"),
    true,
  );
  assert.equal(
    source.includes("if (tab === 'management') return <AdminManagementScreen profile={profile} />;"),
    true,
  );
});
