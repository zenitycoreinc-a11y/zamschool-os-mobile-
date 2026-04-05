import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { projectPath } from "../../test/project-paths.mjs";

import {
  resolveApiOrigin,
  resolveApiOriginsForRuntime,
  resolveApiOriginsFromConfig,
} from "./mobileApi.js";

const appJson = JSON.parse(readFileSync(projectPath("app.json"), "utf8"));

test("local development keeps the localhost origin first and falls back to hosted preview", () => {
  const origins = resolveApiOriginsForRuntime({
    nodeEnv: "development",
    localOrigin: "http://localhost:3000",
    previewOrigin: "https://3000-cf8c1125-a680-48cf-bd60-e6c9caa973a1.orchids.cloud",
  });

  assert.deepEqual(origins, [
    "http://localhost:3000",
    "https://3000-cf8c1125-a680-48cf-bd60-e6c9caa973a1.orchids.cloud",
  ]);
});

test("local development skips duplicate hosted fallback origins", () => {
  const origins = resolveApiOriginsForRuntime({
    nodeEnv: "development",
    localOrigin: "https://3000-cf8c1125-a680-48cf-bd60-e6c9caa973a1.orchids.cloud",
    previewOrigin: "https://3000-cf8c1125-a680-48cf-bd60-e6c9caa973a1.orchids.cloud",
  });

  assert.deepEqual(origins, ["https://3000-cf8c1125-a680-48cf-bd60-e6c9caa973a1.orchids.cloud"]);
});

test("preview and release prefer the app json hosted origin when env vars are absent", () => {
  const previewOrigins = resolveApiOriginsFromConfig({
    nodeEnv: "production",
    env: {},
    routerConfig: appJson.expo.extra.router,
  });

  assert.deepEqual(previewOrigins, ["https://3000-cf8c1125-a680-48cf-bd60-e6c9caa973a1.orchids.cloud"]);
});

test("preview config fails clearly when the hosted origin is loopback", () => {
  assert.throws(
    () =>
      resolveApiOriginsFromConfig({
        nodeEnv: "production",
        env: {
          EXPO_PUBLIC_WEBAPP_PREVIEW_ORIGIN: "http://localhost:3000",
        },
        routerConfig: {
          previewOrigin: "http://localhost:3000",
          origin: "http://localhost:3000",
          headOrigin: "http://localhost:3000",
          localOrigin: "http://localhost:3000",
        },
      }),
    /Preview API origin cannot be loopback/
  );
});

test("resolveApiOrigin returns the first resolved origin asynchronously", async () => {
  const origin = await resolveApiOrigin(async () => [
    "http://localhost:3000",
    "https://preview.example.com",
  ]);

  assert.equal(origin, "http://localhost:3000");
});

test("development config prefers the app json localhost origin when env vars are absent", () => {
  const developmentOrigins = resolveApiOriginsFromConfig({
    nodeEnv: "development",
    env: {},
    routerConfig: appJson.expo.extra.router,
  });

  assert.deepEqual(developmentOrigins, [
    "http://localhost:3000",
    "https://3000-cf8c1125-a680-48cf-bd60-e6c9caa973a1.orchids.cloud",
  ]);
});
