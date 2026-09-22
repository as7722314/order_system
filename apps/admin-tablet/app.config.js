const fs = require("fs");
const path = require("path");
const appJson = require("./app.json");

const environments = {
  local: "http://10.0.2.2:3000/api",
  production: "https://line-order-system-api.onrender.com/api"
};

module.exports = () => {
  const config = { ...appJson.expo };
  const appEnvironment = process.env.APP_ENV || "local";
  if (!(appEnvironment in environments)) {
    throw new Error(`APP_ENV must be one of: ${Object.keys(environments).join(", ")}`);
  }

  const apiBaseUrl = (process.env.EXPO_PUBLIC_API_BASE_URL || environments[appEnvironment]).replace(/\/$/, "");
  const apiHost = new URL(apiBaseUrl).hostname;
  if (appEnvironment !== "production" && apiHost === "line-order-system-api.onrender.com") {
    throw new Error("Safety check: a local App build cannot use the production API. Set APP_ENV=production explicitly.");
  }

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;
  const googleServicesPath = path.join(__dirname, "google-services.json");

  config.extra = {
    ...config.extra,
    appEnvironment,
    apiBaseUrl,
    eas: { ...config.extra?.eas, ...(projectId ? { projectId } : {}) }
  };
  if (fs.existsSync(googleServicesPath)) {
    config.android = {
      ...config.android,
      googleServicesFile: "./google-services.json"
    };
  }

  return config;
};
