import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';

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

    create(dto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
    }
}