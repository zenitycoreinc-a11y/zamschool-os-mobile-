import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getRolePolicy } from "./roleCapabilities.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const paymentsShellSource = readFileSync(
  path.join(dirname, "..", "screens", "PaymentsShellScreen.js"),
  "utf8"
);
const adminShellSource = readFileSync(
  path.join(dirname, "..", "screens", "AdminShellScreen.js"),
  "utf8"
);

test("payments role resolves to a dedicated finance policy", () => {
  const policy = getRolePolicy("payments");

  assert.equal(policy.role, "payments");
  assert.equal(policy.modules.finance_summary, "manage");
  assert.equal(policy.modules.school_admin, "none");
  assert.equal(policy.previewState, "preview-incomplete");
});

test("admin mobile preview keeps management intentionally hidden", () => {
  const policy = getRolePolicy("admin");

  assert.equal(policy.previewState, "ready");
  assert.equal(policy.mobilePreview.management, "hidden");
  assert.equal(policy.mobilePreview.managementLabel, "Web-only");
});

test("payments shell surfaces deferred preview messaging", () => {
  assert.equal(paymentsShellSource.includes("import { getRolePolicy } from '../config/roleCapabilities';"), true);
  assert.equal(paymentsShellSource.includes("const paymentsPolicy = getRolePolicy('payments');"), true);
  assert.equal(
    paymentsShellSource.includes("This mobile role is marked {paymentsPolicy.previewState} while preview scope is frozen."),
    true
  );
});

test("admin shell suppresses management drawer entry when preview policy hides it", () => {
  assert.equal(adminShellSource.includes("const drawerItems = ["), true);
  assert.equal(
    adminShellSource.includes("...(ADMIN_POLICY.mobilePreview.management === 'hidden'"),
    true
  );
  assert.equal(adminShellSource.includes("items={drawerItems}"), true);
});
