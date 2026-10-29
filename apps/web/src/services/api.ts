import type { Project, Task } from '../types/task'

const API_BASE_URL = '/api'

async function request<T>(url: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${url}`)

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