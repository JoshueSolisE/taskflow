import { test, expect } from '../fixtures/test-fixtures';

test('Should display the TaskFlow Dashboard', async ({ 
    dashboardPage
}) => {
    await dashboardPage.goto()

    await expect(dashboardPage.heading).toBeVisible();
    await expect(dashboardPage.taskSummary).toBeVisible();
});

test('Should filter tasks by status', async ({
    dashboardPage
}) => {
    await dashboardPage.goto();

    for (const status of ['All', 'Pending', 'In Progress', 'Done'] as const) {
        await dashboardPage.filterBy(status);

        await expect(
            dashboardPage.getFilterButton(status),
        ).toHaveAttribute('aria-pressed', 'true');
    }
});