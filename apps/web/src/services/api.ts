import type { Project, Task } from '../types/task'
import type { TaskPriority, TaskStatus } from '../types/task'

export interface CreateTaskInput {
    title: string
    description?: string
    status?: TaskStatus
    priority?: TaskPriority
    dueDate?: string
}
export type UpdateTaskInput = Partial<CreateTaskInput>

const API_BASE_URL = '/api'

async function request<T>(
    url: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`, options)

    if (!response.ok){
        throw new Error(`API Error: HTTP ${response.status}`)
    }

    return response.json() as Promise<T>
}

export function getProjects(): Promise<Project[]> {
    return request<Project[]>('/projects')
}

export function getProjectTasks(projectId: string): Promise<Task[]> {
    return request<Task[]>(
        `/projects/${encodeURIComponent(projectId)}/tasks`,
    )
}

export function createTask(
    projectId: string,
    input: CreateTaskInput,
): Promise<Task> {
    return request<Task>(
        `/projects/${encodeURIComponent(projectId)}/tasks`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        },
    )
}

export function updateTask(
    taskId: string,
    input: UpdateTaskInput,
): Promise<Task> {
    return request<Task>(
        `/tasks/${encodeURIComponent(taskId)}`,
        {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(input),
        },
    )
}

export function deleteTask(taskId: string): Promise<void> {
    return request<void>(
        `/tasks/${encodeURIComponent(taskId)}`,
        {
            method: 'DELETE',
        },
    )
}