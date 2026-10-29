export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Project {
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
}

export interface Task {
    id: string
    title: string
    description: string | null
    status: TaskStatus
    priority: TaskPriority
    dueDate: string | null 
    projectId: string
    createdAt: string
    updatedAt: string
}