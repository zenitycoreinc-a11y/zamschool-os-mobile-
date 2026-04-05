import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import {
  listConnectedDevices,
  loadExpoEnv,
  resolveAdbExecutable,
  resolveDeviceName,
} from "./start-expo-android.mjs";

function resolveJavaHome(env) {
  const candidates = [
    env.JAVA_HOME,
    env.JDK_HOME,
    path.join("C:", "Program Files", "Java", "latest"),
    path.join("C:", "Program Files", "Java", "jdk-21.0.10"),
    env.ProgramFiles && path.join(env.ProgramFiles, "Android", "Android Studio", "jbr"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const candidateHomes = [candidate];
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      for (const child of fs.readdirSync(candidate, { withFileTypes: true })) {
        if (child.isDirectory()) {
          candidateHomes.push(path.join(candidate, child.name));
        }
      }
    }

    for (const candidateHome of candidateHomes) {
      const javaExecutable = path.join(
        candidateHome,
        "bin",
        process.platform === "win32" ? "java.exe" : "java"
      );
      if (fs.existsSync(javaExecutable)) {
        return candidateHome;
      }
    }
  }

  return "";
}

function resolveAndroidSdkRoot(env) {
  const candidates = [
    env.ANDROID_HOME,
    env.ANDROID_SDK_ROOT,
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, "Android", "Sdk"),
    env.USERPROFILE && path.join(env.USERPROFILE, "AppData", "Local", "Android", "Sdk"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const adbExecutable = path.join(candidate, "platform-tools", process.platform === "win32" ? "adb.exe" : "adb");
    if (fs.existsSync(adbExecutable)) {
      return candidate;
    }
  }

  return "";
}

function ensureAndroidLocalProperties(androidSdkRoot) {
  if (!androidSdkRoot) {
    return;
  }

  const androidDirectory = path.join(process.cwd(), "android");
  if (!fs.existsSync(androidDirectory)) {
    return;
  }

  const normalizedSdkRoot = androidSdkRoot.replace(/\\/g, "\\\\");
  const localPropertiesPath = path.join(androidDirectory, "local.properties");
  fs.writeFileSync(localPropertiesPath, `sdk.dir=${normalizedSdkRoot}\n`, "utf8");
}

function rebuildExpoAndroid(env, deviceName) {
  const expoCliEntrypoint = path.join(process.cwd(), "node_modules", "expo", "bin", "cli");
  const javaHome = resolveJavaHome(env);
  const androidSdkRoot = resolveAndroidSdkRoot(env);
  ensureAndroidLocalProperties(androidSdkRoot);
  const result = spawnSync(
    process.execPath,
    [expoCliEntrypoint, "run:android", "--device", deviceName, "--no-bundler"],
    {
      cwd: process.cwd(),
      stdio: "inherit",
      env: {
        ...process.env,
        ...env,
        ...(javaHome ? { JAVA_HOME: javaHome } : {}),
        ...(androidSdkRoot
          ? {
              ANDROID_HOME: androidSdkRoot,
              ANDROID_SDK_ROOT: androidSdkRoot,
            }
          : {}),
      },
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (typeof result.status === "number") {
    process.exit(result.status);
  }

  process.exit(1);
}

function resolveRequestedDevice(deviceIds, adbExecutable, requestedDevice) {
  if (!requestedDevice) {
    if (deviceIds.length === 1) {
      return resolveDeviceName(adbExecutable, deviceIds[0]);
    }

    throw new Error(
      `Multiple Android devices are connected. Set EXPO_ANDROID_DEVICE to one of: ${deviceIds.join(", ")}`
    );
  }

  const normalizedRequestedDevice = String(requestedDevice).trim();
  if (!normalizedRequestedDevice) {
    throw new Error("EXPO_ANDROID_DEVICE cannot be empty.");
  }

  const matchingDeviceId = deviceIds.find((deviceId) => deviceId === normalizedRequestedDevice);
  if (matchingDeviceId) {
    return resolveDeviceName(adbExecutable, matchingDeviceId);
  }

  return normalizedRequestedDevice;
}

function main() {
  const env = loadExpoEnv(process.cwd());
  const adbExecutable = resolveAdbExecutable(env);
  const deviceIds = listConnectedDevices(adbExecutable);

  if (deviceIds.length === 0) {
    throw new Error("No Android device connected. Connect a device or start an emulator first.");
  }

  const deviceName = resolveRequestedDevice(deviceIds, adbExecutable, env.EXPO_ANDROID_DEVICE);
  console.log(`[rebuild-expo-android] Targeting ${deviceName}`);
  rebuildExpoAndroid(env, deviceName);
}

main();
