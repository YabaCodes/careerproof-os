import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser',
  fullyParallel:false,
  workers:1,
  timeout:30_000,
  // QA-023: in CI, retry a failed test once so a one-off timing failure cannot block a
  // deployment, and report failures and flaky tests as GitHub annotations so the
  // test name is visible without downloading the job log. Local runs never retry.
  retries:process.env.CI?1:0,
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:375,height:812},acceptDownloads:true,headless:true},
  webServer:{command:'node scripts/test-server.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:false},
  reporter:process.env.CI?[['list'],['github']]:'list'
});
