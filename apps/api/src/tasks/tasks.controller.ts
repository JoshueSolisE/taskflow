import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@Controller()
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get('api/projects/:projectId/tasks')
    findByProject(@Param('projectId', ParseUUIDPipe) projectId: string) {
        return this.tasksService.findByProject(projectId);
    }

    @Post('api/projects/:projectId/tasks')
    create(
        @Param('projectId', ParseUUIDPipe) projectId: string,
        @Body() dto: CreateTaskDto,
    ) {
        return this.tasksService.create(projectId, dto);
    }

    @Patch('/api/tasks/:id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTaskDto,
    ) {
        return this.tasksService.update(id, dto);
    }

    @Delete('/api/tasks/:id')
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.tasksService.remove(id);
    }
}