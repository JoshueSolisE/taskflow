import { type Locator, type Page } from '@playwright/test';

export class DashboardPage {
    readonly heading: Locator;
    readonly taskSummary: Locator;
    readonly taskRows: Locator;

    constructor(private readonly page: Page) {
        this.heading = page.getByRole('heading', {
            name: 'Dashboard',
            exact: true,
        });

        this.taskSummary = page.getByRole('region', {
            name: 'Resumen de tareas',
        });

        this.taskRows = page.locator('article.task-row');
    }

    async goto(): Promise<void> {
        await this.page.goto('/');       
    }

    async filterBy(
        status: 'All' | 'Pending' | 'In Progress' | 'Done',
    ): Promise<void> {
        await this.page.getByRole('button', {
            name: status,
            exact: true,
        }).click();
    }

    getFilterButton(
        status: 'All' | 'Pending' | 'In Progress' | 'Done',
    ): Locator {
        return this.page.getByRole('button', {
            name: status,
            exact: true,
        });
    }
}