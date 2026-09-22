const fs = require("fs");
const path = require("path");
const appJson = require("./app.json");

module.exports = () => {
  const config = { ...appJson.expo };
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;
  const googleServicesPath = path.join(__dirname, "google-services.json");

  if (projectId) {
    config.extra = {
      ...config.extra,
      eas: { ...config.extra?.eas, projectId }
    };
  }
  if (fs.existsSync(googleServicesPath)) {
    config.android = {
      ...config.android,
      googleServicesFile: "./google-services.json"
    };
  }

  return config;
};
