import { test, expect } from '@playwright/test';

test('should create, retrieve, update, and delete a project', async({
    request,
}) => {
    const projectName = `TaskFlow E2E ${Date.now()}`;
    let projectId: string | undefined;

    try {
        const createResponse = await request.post('/api/projects',{
            data: {
                name: projectName,
                description: 'Project created by Playwright E2E tests',
            },
        });

        expect(createResponse.status()).toBe(201);

        const createdProject = await createResponse.json();

        expect(createdProject.id).toBeTruthy();
        expect(createdProject.name).toBe(projectName);

        projectId = createdProject.id;

        const getResponse = await request.get(
            `/api/projects/${projectId}`,
        );
        if (getResponse.status() !== 200) {
            console.log('Created project:', createdProject);
            console.log('Project ID:', projectId);
            console.log('GET status:', getResponse.status());
            console.log('GET response:', await getResponse.text());
        }
        expect(getResponse.status()).toBe(200);

        const retrievedProject = await getResponse.json();

        expect(retrievedProject.id).toBe(projectId);
        expect(retrievedProject.name).toBe(projectName);

        const listResponse = await request.get('/api/projects');

        expect(listResponse.status()).toBe(200);
        
        const projects = await listResponse.json();

        expect(
            projects.some(
                (project: { id: string }) => project.id === projectId,
            ),
        ).toBe(true);

        const updatedName = `${projectName} Updated`;
        const updateResponse = await request.patch(
            `/api/projects/${projectId}`,
            {
                data: {
                    name: updatedName,
                },
            },
        );

        expect(updateResponse.status()).toBe(200);

        const updatedProject = await updateResponse.json();

        expect(updatedProject.id).toBe(projectId);
        expect(updatedProject.name).toBe(updatedName);
        expect(updatedProject.description).toBe(
            'Project created by Playwright E2E tests',
        );

        const deleteResponse = await request.delete(
            `/api/projects/${projectId}`,
        );

        expect(deleteResponse.status()).toBe(200);

        projectId = undefined;

        const missingResponse = await request.get(
            `/api/projects/${createdProject.id}`,
        );

        expect(missingResponse.status()).toBe(404);
    } finally {
        if (projectId) {
            await request.delete(`/api/projects/${projectId}`);
        }
    }
});