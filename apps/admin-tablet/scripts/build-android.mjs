import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const urls = {
  local: "http://10.0.2.2:3000/api",
  production: "https://line-order-system-api.onrender.com/api"
};

const environment = process.argv[2];
if (!(environment in urls)) {
  console.error("Usage: node scripts/build-android.mjs <local|production>");
  process.exit(1);
}

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidDir = join(appDir, "android");
const gradle = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const buildEnv = {
  ...process.env,
  APP_ENV: environment,
  EXPO_PUBLIC_API_BASE_URL: urls[environment],
  NODE_ENV: "production"
};

function runGradle(args) {
  const command = process.platform === "win32" ? "cmd.exe" : gradle;
  const commandArgs = process.platform === "win32" ? ["/d", "/s", "/c", gradle, ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: androidDir,
    env: buildEnv,
    stdio: "inherit"
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Expo API variables are not Gradle task inputs, so force the JS bundle to rebuild.
runGradle([":app:createBundleReleaseJsAndAssets", "--rerun-tasks"]);
runGradle([":app:assembleRelease"]);

const embeddedConfigPath = join(androidDir, "app", "build", "intermediates", "assets", "release", "mergeReleaseAssets", "app.config");
const embeddedConfig = JSON.parse(readFileSync(embeddedConfigPath, "utf8"));
const expectedUrl = urls[environment];
if (embeddedConfig.extra?.appEnvironment !== environment || embeddedConfig.extra?.apiBaseUrl !== expectedUrl) {
  throw new Error(`Built APK config failed the ${environment} API URL safety check.`);
}

const { version } = JSON.parse(readFileSync(join(appDir, "package.json"), "utf8"));
const sourceApk = join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
const targetApk = join(appDir, "dist", `order-system-admin-tablet-${environment}-v${version}.apk`);
mkdirSync(dirname(targetApk), { recursive: true });
copyFileSync(sourceApk, targetApk);
console.log(`Created ${targetApk}`);
