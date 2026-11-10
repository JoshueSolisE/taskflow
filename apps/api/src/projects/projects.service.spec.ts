import { ConflictException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { ProjectsService } from './projects.service.js';

describe('ProjectService', () => {
    let service: ProjectsService;

    const prisma = {
        project: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        task: {
            count: vi.fn(),
        },
    };

    const projectId = '123e4567-e89b-42d3-a456-426614174000';

    const project = {
        id: projectId,
        name: 'Taskflow Demo',
        description: 'Test project',
        createdAt: new Date('2026-01-01T10:00:00Z'),
        updatedAt: new Date('2026-01-01T10:00:00Z'),
    };

    beforeEach(() => {
        vi.resetAllMocks();

        service = new ProjectsService(
            prisma as unknown as PrismaService,
        );
    });

    describe('findAll', () => {
        it('should return all projects ordered by creation date descending', async () => {
            prisma.project.findMany.mockResolvedValue([project]);

            const result = await service.findAll();

            expect(result).toEqual([project]);
            expect(prisma.project.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
            });
        });
    });;

    describe('findOne', () => {
        it('should return a project when it exists', async() => {
            prisma.project.findUnique.mockResolvedValue(project);

            const result = await service.findOne(project.id);

            expect(result).toEqual(project);
            expect(prisma.project.findUnique).toHaveBeenCalledWith({
                where: { id: projectId },
            });
        });

        it('should throw NotfoundException when the project does not exist', async () => {
            prisma.project.findUnique.mockResolvedValue(null);

            await expect(service.findOne(projectId))
                .rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        it('should create a new project with the provided data', async () => {
            const dto: CreateProjectDto = {
                name: 'New Project',
                description: ' A new project description',
            };

            prisma.project.create.mockResolvedValue(project);

            const result = await service.create(dto);

            expect(result).toEqual(project);
            expect(prisma.project.create).toHaveBeenCalledWith({
                data: {
                    name: dto.name,
                    description: dto.description,
                },
            });
        });
    });

    describe('update', () => {
        it('should update a project with the provided fields', async () => {
            const dto: UpdateProjectDto = {
                name: 'Updated project',
            };

            prisma.project.findUnique.mockResolvedValue(project);
            prisma.project.update.mockResolvedValue({
                ...project,
                name: dto.name,
            });

            const result = await service.update(projectId, dto);

            expect(result.name).toBe('Updated project');
            expect(prisma.project.update).toHaveBeenCalledWith({
                where: { id: projectId },
                data: { name: dto.name },
            });
        });

        it('should throw NotFoundExceptionwhe updating a missing project', async () => {
            prisma.project.findUnique.mockResolvedValue(null);

            await expect(
                service.update(projectId, { name: 'Updated project' }),
            ).rejects.toThrow(NotFoundException);

            expect(prisma.project.update).not.toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        it('should delete a project when it has no tasks associated', async () => {
            prisma.project.findUnique.mockResolvedValue(project);
            prisma.task.count.mockResolvedValue(0);
            prisma.project.delete.mockResolvedValue(project);

            const result = await service.remove(projectId);

            expect(result).toEqual(project);
            expect(prisma.task.count).toHaveBeenCalledWith({
                where: { projectId },
            });
            expect(prisma.project.delete).toHaveBeenCalledWith({
                where: { id: projectId },
            });
        });

        it('should throw ConflictException when the project has associated tasks', async () => {
            prisma.project.findUnique.mockResolvedValue(project);
            prisma.task.count.mockResolvedValue(3);

            await expect(service.remove(projectId))
                .rejects.toThrow(ConflictException);
            
            expect(prisma.project.delete).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when deleting a missing project', async () => {
            prisma.project.findUnique.mockResolvedValue(null);

            await expect(service.remove(projectId))
                .rejects.toThrow(NotFoundException);
            
            expect(prisma.task.count).not.toHaveBeenCalled();
            expect(prisma.project.delete).not.toHaveBeenCalled();
        });
    });
})
