import { test, expect } from '@playwright/test';

test('should create, retrieve, update and delete a project', async ({ request }) => {
    let projectId: string | undefined;

    try {
        await test.step('1. Create a project', async () => {
            const response = await request.post('/api/projects', {
                data: {
                    name: `TaskFlow E2E ${Date.now()}`,
                    description: 'Project created by Playwright E2E tests',
                },
            });

            expect(response.status()).toBe(201);

            const project = await response.json();
            projectId = project.id;

            expect(projectId).toBeTruthy();
            expect(project.name).toContain('TaskFlow E2E');
        });

        await test.step('2. Retrieve the project by ID', async () => {
            const response = await request.get(`/api/projects/${projectId}`);

            expect(response.status()).toBe(200);

            const project = await response.json();
            expect(project.id).toBe(projectId);
        });

        await test.step('3. Verify the project appears in the list', async () => {
            const response = await request.get('/api/projects');

            expect(response.status()).toBe(200);

            const projects = await response.json();
            expect(projects.some((project: { id: string }) => project.id === projectId))
                .toBe(true);
        });

        await test.step('4. Update the project', async () => {
            const updatedName = `TaskFlow E2E Updated ${Date.now()}`;

            const response = await request.patch(`/api/projects/${projectId}`, {
                data: { name: updatedName },
            });

            expect(response.status()).toBe(200);

            const project = await response.json();
            expect(project.name).toBe(updatedName);
            expect(project.description).toBe('Project created by Playwright E2E tests');
        });

        await test.step('5. Delete the project', async () => {
            const response = await request.delete(`/api/projects/${projectId}`);

            expect(response.status()).toBe(200);
        });

        await test.step('6. Verify the project no longer exists', async () => {
            const response = await request.get(`/api/projects/${projectId}`);

            expect(response.status()).toBe(404);
        });
    } finally {
        // Clean up only the project created by this test if it still exists.
        if (projectId) {
            await request.delete(`/api/projects/${projectId}`);
        }
    }
});