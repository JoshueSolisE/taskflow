
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e/api',
    fullyParallel: false,
    reporter: 'list',
    timeout: 30_000,
    expect: {
        timeout: 5_000,
    },
    use: {
        baseURL: 'http://127.0.0.1:3000',
        trace: 'retain-on-failure',
    },
    webServer: {
        command: 'npm --prefix ../api run start:dev',
        url: 'http://127.0.0.1:3000/api/health',
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
