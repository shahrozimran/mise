import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: "http://localhost:8081",
    browserName: "chromium",
    channel: "chromium",
    viewport: { width: 1280, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: process.env.CI
    ? {
        command:
          "npm run web --workspace @mise/mobile -- --port 8081 --max-workers 2",
        url: "http://localhost:8081",
        timeout: 180000,
        reuseExistingServer: false,
      }
    : undefined,
});
