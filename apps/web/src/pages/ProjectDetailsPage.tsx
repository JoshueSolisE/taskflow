import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import {
    createTask,
    getProject,
    getProjectTasks,
    updateTask,
} from '../services/api'
import type { Project, Task } from '../types/task'
import type { TaskPriority, TaskStatus } from '../types/task'
import type { FormEvent } from 'react'

export default function ProjectDetailsPage() {
    const { projectId } = useParams()

    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<TaskStatus>('TODO')
    const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
    const [dueDate, setDueDate] = useState('')

    useEffect(() => {
        if (!projectId) return

        const controller = new AbortController()

        Promise.all([
            getProject(projectId, { signal: controller.signal }),
            getProjectTasks(projectId),
        ])
            .then(([projectData, tasksData]) => {
                if (controller.signal.aborted) return
                
                setProject(projectData)
                setTasks(tasksData)
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return

                setError(
                    err instanceof Error
                        ? err.message
                        : 'The project could not be loaded.',
                )
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            })
        
        return () => controller.abort()
    }, [projectId])

    function resetForm() {
        setEditingTaskId(null)
        setTitle('')
        setDescription('')
        setStatus('TODO')
        setPriority('MEDIUM')
        setDueDate('')
        setError(null)
        setSuccess(null)
    }

    function handleEditTask(task: Task) {
        setEditingTaskId(task.id)
        setTitle(task.title)
        setDescription(task.description ?? '')
        setStatus(task.status)
        setPriority(task.priority)
        setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : '')
        setError(null)
        setSuccess(null)
    }

    async function handleSubmitTask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!projectId || !title.trim()) {
            setError('The task title is mandatory.')
            return
        }

        setIsSaving(true)
        setError(null)
        setSuccess(null)

        const input = {
            title: title.trim(),
            description: description.trim(),
            status,
            priority,
            dueDate: dueDate || undefined,
        }

        try {
            if (editingTaskId) {
                const updatedTask = await updateTask(editingTaskId, input)
                setTasks((currentTasks) =>
                    currentTasks.map((task) =>
                        task.id === updatedTask.id ? updatedTask : task,
                    ),
                )

                resetForm()
                setSuccess('The task was updated successfully.')
            } else {
                const newTask = await createTask(projectId, input)

                setTasks((currentTasks) => [...currentTasks, newTask])

                resetForm()
                setSuccess('The task was created successfully.')
            }   
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'The task could not be created.',
            )
        } finally {
            setIsSaving(false)
        }
    }

    if (!projectId) {
        return (
            <section>
                <h1>Proyect Details</h1>
                <p role="alert">No project was specified.</p>
            </section>
        )
    }

    if (isLoading) {
        return <section><p>Loading project...</p></section>
    }

    if (error && !project) {
        return (
            <section>
                <h1>Proyect Details</h1>
                <p role='alert'>{error}</p>
            </section>
        )
    }

    if (!project) {
        return (
            <section>
                <h1>Project not found</h1>
            </section>
        )
    }

    return (
        <section>
            <h1>{project.name}</h1>

            <p>
                {project.description || 'This project has no description.'}
            </p>

            <h2>{editingTaskId ? 'Edit task' : 'Create task'}</h2>

            <form onSubmit={handleSubmitTask}>
                <div>
                    <label htmlFor="task-title">Title *</label>
                    <input
                        id='task-title'
                        name='title'
                        type="text"
                        maxLength={200}
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="task-description">Description</label>
                    <textarea
                        id="task-description"
                        name="description"
                        maxLength={2000}
                        value={description}
                        onChange={(event) =>
                            setDescription(event.target.value)
                        }
                    />
                </div>

                <div>
                    <label htmlFor="task-status">Status</label>
                    <select
                        id="task-status"
                        value={status}
                        onChange={(event) =>
                            setStatus(event.target.value as TaskStatus)
                        }
                    >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="task-priority">Priority</label>
                    <select
                        id="task-priority"
                        value={priority}
                        onChange={(event) =>
                            setPriority(event.target.value as TaskPriority)
                        }
                    >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="task-due-date">Deadline</label>
                    <input
                        id='task-due-date'
                        name='dueDate'
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                    />
                </div>

                <button type="submit" disabled={isSaving}>
                    {isSaving
                        ? 'Saving...'
                        : editingTaskId !== null
                            ? 'Save changes'
                            : 'Create task'}
                </button>

                {editingTaskId && (
                    <button
                        type='button'
                        onClick={resetForm}
                        disabled={isSaving}
                    >
                        Cancel edit
                    </button>
                )}
            </form>

            {error && <p role='alert'>{error}</p>}
            {success && <p role='status'>{success}</p>}

            <h2>Project tasks</h2>

            {tasks.length === 0 ? (
                <p>This project does not yet have any tasks.</p>
            ) : (
                <ul>
                    {tasks.map((task) => (
                        <li key={task.id}>
                            <strong>{task.title}</strong>
                            {' — '}
                            Status: {task.status}
                            {' — '}
                            Priority: {task.priority}

                            {task.dueDate && (
                                <p>
                                    Deadline:{''}
                                    {new Date(
                                        task.dueDate,
                                    ).toLocaleDateString()}
                                </p>
                            )}

                            <button
                                type='button'
                                onClick={() => handleEditTask(task)}
                                disabled={isSaving}
                            >
                                Edit
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}