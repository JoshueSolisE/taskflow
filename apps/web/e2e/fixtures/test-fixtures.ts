import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';

type TaskFlowFixtures = {
    dashboardPage: DashboardPage;
};

export const test = base.extend<TaskFlowFixtures>({
    dashboardPage: async ({ page }, use) => {
        const dashboardPage = new DashboardPage(page);
        
        await use(dashboardPage);
    },
});

export { expect } from '@playwright/test';
