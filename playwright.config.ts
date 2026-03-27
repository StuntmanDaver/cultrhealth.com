import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 90000,
  use: {
    baseURL: 'https://staging.cultrhealth.com',
    screenshot: 'on',
  },
  projects: [
    { name: 'Desktop 1920', use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'Desktop 1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'Desktop 1280', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'Laptop 1024', use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
    { name: 'Tablet 768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
  ],
});
