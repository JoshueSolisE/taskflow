import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

@Injectable()
export class TasksService {
    constructor(private readonly prisma: PrismaService) {}

    async findByProject(projectId: string) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });

        if (!project) {
            throw new NotFoundException('Project Not Found');
        }

        return this.prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(projectId: string, dto: CreateTaskDto) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true },
        });

        if ( !project ) {
            throw new NotFoundException('Project Not Found');
        }

        return this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                status: dto.status,
                priority: dto.priority,
                dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
                projectId,
            },
        });
    }

    async update(taskId: string, dto: UpdateTaskDto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true },
        });

        if (!task) {
            throw new NotFoundException('Task Not Found');
        }

        return this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.description !== undefined && {
                    description: dto.description,
                }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.priority !== undefined && {
                    priority: dto.priority,
                }),
                ...(dto.dueDate !== undefined && {
                    dueDate: new Date(dto.dueDate), 
                }),
            },
        });
    }

    async remove(taskId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            select: { id: true },
        });

        if (!task) {
            throw new NotFoundException('Task Not Found');
        }

        await this.prisma.task.delete({
            where: { id: taskId },
        })

        return {
            id: taskId,
            deleted: true,
        }
    }
}