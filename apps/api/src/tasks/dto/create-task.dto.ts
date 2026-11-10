import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskPriority, TaskStatus } from '../../../generated/prisma/enums.js';

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title!: string;

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @IsOptional()
    @IsDateString()
    dueDate?: string;
}