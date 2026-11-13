import { test, expect } from '@playwright/test';

test(`should return 404 when a project does not exist`, async ({
    request,
}) => {
    const missingId = '00000000-0000-4000-8000-000000000001';

    const response = await request.get(
        `/api/projects${missingId}`,
    );

    expect(response.status()).toBe(404);
});

test('should return 400 when the project ID is not a UUID', async ({
    request,
}) => {
    const response = await request.get(
        '/api/projects/not-a-valid-uuid',
    );

    expect(response.status()).toBe(400);

    const body = await response.json();

    expect(body.message).toContain('uuid');
});

test('should return 400 whe creating a project withiut a name', async({
    request,
}) => {
    const response = await request.post('/api/projects', {
        data: {
            name: '',
            description: 'Invalid project created by E2E test',
        },
    });

    expect(response.status()).toBe(400);
});