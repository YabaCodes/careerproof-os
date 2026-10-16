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
  // CP-UX-Fluid (DEC-038): suites measure finished layouts, so they run with Reduce Motion on.
  // Motion itself is covered in ux-fluid.spec.mjs, which turns it back on per test.
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:375,height:812},acceptDownloads:true,headless:true,contextOptions:{reducedMotion:'reduce'}},
  webServer:{command:'node scripts/test-server.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:false},
  reporter:process.env.CI?[['list'],['github']]:'list'
});
