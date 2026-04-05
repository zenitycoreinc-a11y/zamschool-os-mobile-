import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);
const ENV_FILES = [".env.local", ".env"];

export function extractReversePorts(env) {
  const values = [
    env.EXPO_PUBLIC_WEBAPP_ORIGIN,
    env.EXPO_PUBLIC_API_ORIGIN,
  ].filter(Boolean);

  const ports = new Set();
  for (const value of values) {
    for (const origin of String(value).split(",")) {
      const trimmed = origin.trim();
      if (!trimmed) continue;

      try {
        const url = new URL(trimmed);
        if (!LOOPBACK_HOSTS.has(url.hostname)) continue;
        const port = Number(url.port || defaultPortForProtocol(url.protocol));
        if (Number.isInteger(port) && port > 0) {
          ports.add(port);
        }
      } catch {
        continue;
      }
    }
  }

  return Array.from(ports).sort((left, right) => left - right);
}

function defaultPortForProtocol(protocol) {
  if (protocol === "https:") return 443;
  return 80;
}

export function loadExpoEnv(cwd) {
  const loaded = {};

  for (const filename of ENV_FILES) {
    const absolutePath = path.join(cwd, filename);
    if (!fs.existsSync(absolutePath)) continue;

    const source = fs.readFileSync(absolutePath, "utf8");
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;

      const separatorIndex = line.indexOf("=");
      if (separatorIndex <= 0) continue;

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();
      if (!key) continue;

      loaded[key] = stripWrappingQuotes(value);
    }
  }

  return {
    ...loaded,
    ...process.env,
  };
}

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function resolveAdbExecutable(env) {
  const extension = process.platform === "win32" ? ".exe" : "";
  const candidates = [
    env.ANDROID_HOME && path.join(env.ANDROID_HOME, "platform-tools", `adb${extension}`),
    env.ANDROID_SDK_ROOT && path.join(env.ANDROID_SDK_ROOT, "platform-tools", `adb${extension}`),
    env.LOCALAPPDATA &&
      path.join(env.LOCALAPPDATA, "Android", "Sdk", "platform-tools", `adb${extension}`),
    env.USERPROFILE &&
      path.join(env.USERPROFILE, "AppData", "Local", "Android", "Sdk", "platform-tools", `adb${extension}`),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return `adb${extension}`;
}

export function listConnectedDevices(adbExecutable) {
  const result = spawnSync(adbExecutable, ["devices"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const stderr = String(result.stderr || "").trim();
    throw new Error(stderr || "Failed to list adb devices.");
  }

  return String(result.stdout || "")
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts[1] === "device")
    .map((parts) => parts[0]);
}

export function resolveDeviceName(adbExecutable, deviceId) {
  const result = spawnSync(adbExecutable, ["-s", deviceId, "shell", "getprop", "ro.product.model"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    return deviceId;
  }

  const deviceName = String(result.stdout || "").trim();
  return deviceName || deviceId;
}

function reversePortsOnDevices(adbExecutable, deviceIds, ports) {
  for (const deviceId of deviceIds) {
    for (const port of ports) {
      const result = spawnSync(
        adbExecutable,
        ["-s", deviceId, "reverse", `tcp:${port}`, `tcp:${port}`],
        {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
        }
      );

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        const stderr = String(result.stderr || "").trim();
        throw new Error(stderr || `Failed to reverse tcp:${port} for ${deviceId}.`);
      }
    }
  }
}

function startExpoAndroid(env) {
  const expoCliEntrypoint = path.join(process.cwd(), "node_modules", "expo", "bin", "cli");
  const result = spawnSync(process.execPath, [expoCliEntrypoint, "start", "--dev-client", "--android"], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      ...env,
    },
  });

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  process.exit(1);
}

function main() {
  const env = loadExpoEnv(process.cwd());
  const reversePorts = extractReversePorts(env);

  if (reversePorts.length > 0) {
    const adbExecutable = resolveAdbExecutable(env);
    const deviceIds = listConnectedDevices(adbExecutable);
    if (deviceIds.length > 0) {
      reversePortsOnDevices(adbExecutable, deviceIds, reversePorts);
      console.log(
        `[start-expo-android] Reversed ${reversePorts
          .map((port) => `tcp:${port}`)
          .join(", ")} for ${deviceIds.join(", ")}`
      );
    }
  }

  startExpoAndroid(env);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
