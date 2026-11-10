import { 
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
    constructor(private readonly prisma: PrismaService) {}

    findAll() {
        return this.prisma.project.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const project = await this.prisma.project.findUnique({
            where: { id },
        });

        if (!project) {
            throw new NotFoundException(`Project with id ${id} not found`);
        };

        return project;
    }

    create(dto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
    }

    async update(id: string, dto: UpdateProjectDto) {
        await this.findOne(id);

        return this.prisma.project.update({
            where: { id },
            data: { 
                ...(dto.name !== undefined && { name: dto.name }),
                ...(dto.description !== undefined && { description: dto.description }),
            },
        });
    }

    async remove(id: string) {
        await this.findOne(id);

        const taskCount = await this.prisma.task.count({
            where: { projectId: id },
        });

        if (taskCount > 0) {
            throw new ConflictException(`The project cannot be deleted because it has ${taskCount} tasks asociated with it.`);
        }

        return this.prisma.project.delete({
            where: { id },
        });
    }
}