import { Link, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import {
    createTask,
    deleteTask,
    getProject,
    getProjectTasks,
    updateTask,
} from '../services/api'
import type { Project, Task } from '../types/task'
import type { TaskPriority, TaskStatus } from '../types/task'
import type { FormEvent } from 'react'
import DatePicker from '../components/DatePicker.tsx'

export default function ProjectDetailsPage() {
    const { projectId } = useParams()

    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null) 

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

    async function handleDeleteTask(task: Task) {
        const confirmed = window.confirm(
            `Are you sure you want to delete "${task.title}"?`,
        )

        if (!confirmed) return

        setDeletingTaskId(task.id)
        setError(null)
        setSuccess(null)

        try {
            await deleteTask(task.id)

            setTasks((currentTasks) => 
                currentTasks.filter((currentTasks) => currentTasks.id !== task.id),
            )

            if (editingTaskId === task.id) {
                resetForm()
            }

            setSuccess('The task was deleted successfully.')
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'The task could not be deleted.',
            )
        } finally {
            setDeletingTaskId(null)
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
        <main className='main-content'>
            <div className='page-content'>
                <header className='project-details-header'>
                    <Link
                        className="project-back-link"
                        to="/projects"
                    >
                        ← Back to projects
                    </Link>

                    <div className='project-details-heading'>
                        <h1>{project.name}</h1>

                        <p>
                            {project.description ||
                                'This project has no description.'}
                        </p>
                    </div>
                </header>

                <h2>{editingTaskId ? 'Edit task' : 'Create task'}</h2>
                
                <section className="task-form-section">
                    <div className="task-section-heading">
                        <div>
                            <h2>{editingTaskId ? 'Edit task' : 'Create task'}</h2>
                            <p>
                                {editingTaskId
                                    ? 'Update the details of this task.'
                                    : 'Add a new task to this project.'}
                            </p>
                        </div>
                    </div>

                    <form
                        className="task-form-card"
                        onSubmit={handleSubmitTask}
                    >
                        <div className="task-form-grid">
                            <div className="task-form-field task-form-field-wide">
                                <label htmlFor="task-title">Title *</label>
                                <input
                                    id="task-title"
                                    name="title"
                                    type="text"
                                    maxLength={200}
                                    value={title}
                                    onChange={(event) => setTitle(event.target.value)}
                                    placeholder="Enter a task title"
                                    required
                                />
                            </div>

                            <div className="task-form-field task-form-field-wide">
                                <label htmlFor="task-description">Description</label>
                                <textarea
                                    id="task-description"
                                    name="description"
                                    maxLength={2000}
                                    rows={3}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    placeholder="Describe the task (optional)"
                                />
                            </div>

                            <div className="task-form-field">
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

                            <div className="task-form-field">
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

                            <div className="task-form-field">
                                <label htmlFor="task-due-date">Deadline</label>
                                <DatePicker
                                    id="task-due-date"
                                    value={dueDate}
                                    onChange={setDueDate}
                                    placeholder="Pick a deadline"
                                />
                            </div>
                        </div>

                        <div className="task-form-actions">
                            <button className='primary-button' type="submit" disabled={isSaving}>
                                {isSaving
                                    ? 'Saving...'
                                    : editingTaskId
                                        ? 'Save changes'
                                        : 'Create task'}
                            </button>

                            {editingTaskId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    disabled={isSaving}
                                >
                                    Cancel edit
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {error && <p role='alert'>{error}</p>}
                {success && <p role='status'>{success}</p>}


                <section className="project-tasks-section">
                    <div className="task-section-heading">
                        <div>
                            <h2>Project tasks</h2>
                            <p>
                                {tasks.length === 1
                                    ? '1 task in this project'
                                    : `${tasks.length} tasks in this project`}
                            </p>
                        </div>
                    </div>

                    {tasks.length === 0 ? (
                        <div className="task-empty-state">
                            <h3>No tasks yet</h3>
                            <p>Create your first task using the form above.</p>
                        </div>
                    ) : (
                        <ul className="project-task-list">
                            {tasks.map((task) => (
                                <li className="project-task-item" key={task.id}>
                                    <div className="project-task-info">
                                        <strong className="project-task-title">
                                            {task.title}
                                        </strong>

                                        {task.description && (
                                            <p className="project-task-description">
                                                {task.description}
                                            </p>
                                        )}

                                        <div className="project-task-meta">
                                            <span className={`task-status-label status-${task.status.toLowerCase().replace('_', '-')}`}>
                                                {task.status.replace('_', ' ')}
                                            </span>

                                            <span className={`task-priority-label priority-${task.priority.toLowerCase()}`}>
                                                {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()} priority
                                            </span>

                                            <span>
                                                Deadline:{' '}
                                                {task.dueDate
                                                    ? new Date(`${task.dueDate.slice(0, 10)}T00:00:00`).toLocaleDateString()
                                                    : 'No deadline'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="project-task-actions">
                                        <button
                                        className='action-button action-button--edit'
                                            type="button"
                                            onClick={() => handleEditTask(task)}
                                            disabled={isSaving || deletingTaskId !== null}
                                        >
                                            Edit
                                        </button>

                                        <button
                                        className='action-button action-button--delete'
                                            type="button"
                                            onClick={() => void handleDeleteTask(task)}
                                            disabled={isSaving || deletingTaskId !== null}
                                        >
                                            {deletingTaskId === task.id
                                                ? 'Deleting...'
                                                : 'Delete'}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}