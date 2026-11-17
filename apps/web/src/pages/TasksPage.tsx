import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import {
    createTask,
    deleteTask,
    getProjects,
    getProjectTasks,
    updateTask,
} from '../services/api'
import type { CreateTaskInput } from "../services/api"
import type { Task, Project, TaskStatus, TaskPriority } from '../types/task'
import DatePicker from '../components/DatePicker.tsx'

type TaskWithProject = Task & {
    projectName: string
}

type StatusFilter = 'ALL' | TaskStatus
type PriorityFilter = 'ALL' | TaskPriority

const statusLabels: Record<TaskStatus, string> = {
    TODO: 'Pending',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
}

const priorityLabels: Record<TaskPriority, string> = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
}

function formatDate(value: string | null): string {
    if (!value) return 'No due date'

    const date = new Date(`${value.slice(0, 10)}T12:00:00`)

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date)
}

async function fetchTasksWithProjects(): Promise<{
    projects: Project[]
    tasks: TaskWithProject[]
}> {
    const projects = await getProjects()
    
    const results = await Promise.all(
        projects.map(async (project) => ({
            project,
            tasks: await getProjectTasks(project.id),
        })),
    )

    const tasks: TaskWithProject[] = results.flatMap(
        ({ project, tasks: projectTasks }) =>
            projectTasks.map((task) => ({
                ...task,
                projectName: project.name,
            })),
    )

    return { projects, tasks }
}

export default function TasksPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [tasks, setTasks] = useState<TaskWithProject[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
    
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter | 'ALL'>('ALL')
    const [priorityFilter, setPriorityFilter] =
        useState<PriorityFilter>('ALL')
    const [projectFilter, setProjectFilter] = useState('ALL')

    const [showForm, setShowForm] = useState(false)
    const [editingTask, setEditingTask] = useState<TaskWithProject | null>(null,)

    const [projectId, setProjectId] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<TaskStatus>('TODO')
    const [priority, setPriority] = useState<TaskPriority>('MEDIUM')
    const [dueDate, setDueDate] = useState('')

    async function loadTasks(showLoading = true) {
        try {
            if (showLoading) setIsLoading(true)
            setError(null)

            const data = await fetchTasksWithProjects()

            setProjects(data.projects)
            setTasks(data.tasks)
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Tasks could not be loaded.',
            )
        } finally {
            if (showLoading) setIsLoading(false)
        }
    }

    useEffect(() => {
        let active = true

        async function initialLoad() {
            try {
                const data = await fetchTasksWithProjects()

                if (!active) return

                setProjects(data.projects)
                setTasks(data.tasks)
                setProjectId(data.projects[0]?.id ?? '')
            } catch (err: unknown) {
                if (!active) return

                setError(
                    err instanceof Error
                        ? err.message
                        : 'Tasks could not be loaded',
                )
            } finally {
                if (active) setIsLoading(false)
            }
        }

        void initialLoad()

        return () => {
            active = false
        }
    }, [])

    function resetForm() {
        setShowForm(false)
        setEditingTask(null)
        setProjectId(projects[0]?.id ?? '')
        setTitle('')
        setDescription('')
        setStatus('TODO')
        setPriority('MEDIUM')
        setDueDate('')
    }

    function openCreateForm() {
        setError(null)
        setSuccess(null)
        setEditingTask(null)
        setProjectId(projects[0]?.id ?? '')
        setTitle('')
        setDescription('')
        setStatus('TODO')
        setPriority('MEDIUM')
        setDueDate('')
        setShowForm(true)
    }

    function openEditForm(task: TaskWithProject) {
        setError(null)
        setSuccess(null)
        setEditingTask(task)
        setProjectId(task.projectId)
        setTitle(task.title)
        setDescription(task.description ?? '')
        setStatus(task.status)
        setPriority(task.priority)
        setDueDate(task.dueDate?.slice(0, 10) ?? '')
        setShowForm(true)
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (!title.trim()) {
            setError('Task title is required.')
            return
        }

        if (!editingTask && !projectId) {
            setError('Please select a project.')
            return
        }

        const input: CreateTaskInput = {
            title: title.trim(),
            description: description.trim(),
            status,
            priority,
            dueDate: dueDate
                ? new Date(`${dueDate}T12:00:00`).toISOString()
                : undefined,
        }

        setIsSaving(true)
        setError(null)
        setSuccess(null)

        try {
            if (editingTask) {
                await updateTask(editingTask.id, input)
                setSuccess('Task updated successfully.')
            } else {
                await createTask(projectId, input)
                setSuccess('Task created successfully.')
            }

            resetForm()
            await loadTasks(false)
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'The task could not be saved.',
            )
        } finally {
            setIsSaving(false)
        }
    }

    async function handleDelete(task: TaskWithProject) {
        if (
            !window.confirm(
                `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
            )
        ) {
            return
        }

        setDeletingTaskId(task.id)
        setError(null)
        setSuccess(null)

        try {
            await deleteTask(task.id)

            setTasks((current) =>
                current.filter((item) => item.id !== task.id),
            )

            if (editingTask?.id === task.id) resetForm()

            setSuccess('Task deleted successfully.')
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

    const filteredTasks = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        return tasks
            .filter((task) => {
                const matchesSearch =
                    task.title.toLowerCase().includes(normalizedSearch) ||
                    task.projectName.toLowerCase().includes(normalizedSearch)

                const matchesStatus =
                    statusFilter === 'ALL' || task.status === statusFilter

                const matchesPriority =
                    priorityFilter === 'ALL' ||
                    task.priority === priorityFilter

                const matchesProject =
                    projectFilter === 'ALL' ||
                    task.projectId === projectFilter

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesPriority &&
                    matchesProject
                )
            })
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }, [tasks, search, statusFilter, priorityFilter, projectFilter])

    return (
        <main className="main-content">
            <div className="page-content">
                <header className="welcome-section">
                    <div>
                        <p className="eyebrow">YOUR WORKSPACE</p>
                        <h1>Tasks</h1>
                        <p className="muted">
                            Manage tasks across all your projects.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={openCreateForm}
                        disabled={projects.length === 0}
                    >
                        + New Task
                    </button>
                </header>

                <section className="stats-grid" aria-label="Task summary">
                    <article className="stat-card">
                        <span className="stat-heading">Total Tasks</span>
                        <strong className="stat-number">{tasks.length}</strong>
                        <span className="stat-caption">Across all projects</span>
                    </article>

                    <article className="stat-card">
                        <span className="stat-heading">Pending</span>
                        <strong className="stat-number">{tasks.filter((task) => task.status === 'TODO').length}</strong>
                        <span className="stat-caption">Waiting to statrt</span>
                    </article>

                    <article className="stat-card">
                        <span className="stat-heading">In Progress</span>
                        <strong className="stat-number">{tasks.filter((task) => task.status === 'IN_PROGRESS').length}</strong>
                        <span className="stat-caption">Currently underway</span>
                    </article>

                    <article className="stat-card">
                        <span className="stat-heading">Completed</span>
                        <strong className="stat-number">{tasks.filter((task) => task.status === 'DONE').length}</strong>
                        <span className="stat-caption">Succesfully finished</span>
                    </article>
                </section>

                {error && <p className="form-error" role="alert">{error}</p>}
                {success && <p role="status">{success}</p>}

                {showForm && (
                    <form className="task-form" onSubmit={handleSubmit}>
                        <h2>{editingTask ? 'Edit Task' : 'Create Task'}</h2>

                        {!editingTask && (
                            <label>
                                Project
                                <select
                                    value={projectId}
                                    onChange={(event) => setProjectId(event.target.value)}
                                    required
                                    >
                                        <option value=''>Select a project</option>
                                        {projects.map((project) => (
                                            <option key={project.id} value={project.id}>
                                                {project.name}
                                            </option>
                                        ))}
                                    </select>
                            </label>
                        )}

                        {editingTask && (
                            <p className="muted">
                                Project: {editingTask.projectName}
                            </p>
                        )}

                        <label>
                            Title
                            <input
                                value={title}
                                onChange={(event) => setTitle(event.target.value)}
                                maxLength={200}
                                required
                                placeholder="e.g. Implement Login"
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                maxLength={2000}
                                rows={3}
                                placeholder="Describe the task..."
                            />
                        </label>

                        <div className="task-form-grid">
                            <label>
                                Status
                                <select
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(event.target.value as TaskStatus)
                                    }
                                >
                                    <option value="TODO">Pending</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                </select>
                            </label>
                            
                            <label>
                                Priority
                                <select
                                    value={priority}
                                    onChange={(event) =>
                                        setPriority(event.target.value as TaskPriority)
                                    }
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                </select>
                            </label>
                        </div>

                        <label htmlFor="task-due-date">Due Date</label>
                        <DatePicker
                            id="task-due-date"
                            value={dueDate}
                            onChange={setDueDate}
                            placeholder="Pick a due date"
                        />

                        <div className="task-form-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={resetForm}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={isSaving}
                            >
                                {isSaving
                                    ? 'Saving...'
                                    : editingTask
                                        ? 'Save Changes'
                                        : 'Create Task'}
                            </button>
                        </div>
                    </form>
                )}

                <section className="section-block" aria-label="Task-list">
                    <div className="section-heading">
                        <div>
                            <h2>All Tasks</h2>
                            <p className="muted">
                                {filteredTasks.length} of {tasks.length} tasks
                            </p>
                        </div>
                    </div>

                    <div className="task-form task-filters-panel">
                        <label>
                            Search
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search tasks or projects..."
                            />
                        </label>

                        <div className="task-form-grid">
                            <label>
                                Status
                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value as StatusFilter)
                                    }
                                >
                                    <option value="ALL">All Statuses</option>
                                    <option value="Pending">Pending</option>
                                    <option value="IN_PORGRESS">In Progress</option>
                                    <option value="DONE">Done</option>
                                </select>
                            </label>

                            <label>
                                Priority
                                <select
                                    value={priorityFilter}
                                    onChange={(event) =>
                                        setPriorityFilter(event.target.value as PriorityFilter)
                                    }
                                >
                                    <option value="ALL">All priorities</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                            </label>
                        </div>

                        <label>
                            Project
                            <select
                                value={projectFilter}
                                onChange={(event) => setProjectFilter(event.target.value)}
                            >
                                <option value="ALL">All projects</option>
                                {projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="task-form-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    setSearch('')
                                    setStatusFilter('ALL')
                                    setPriorityFilter('ALL')
                                    setProjectFilter('ALL')
                                }}
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {isLoading && (
                        <p className="muted" role="status">Loading tasks...</p>
                    )}

                    {!isLoading && !error && tasks.length === 0 && (
                        <p className="empty-state">
                            No tasks match your current filters.
                        </p>
                    )}

                    {!isLoading && filteredTasks.length > 0 && (
                        <div className="task-list">
                            {filteredTasks.map((task) => (
                                <article className="task-row" key={task.id}>
                                    <div className="task-info">
                                        <strong>{task.title}</strong>
                                        <span>{task.projectName}</span>
                                        {task.description && (
                                            <span>{task.description}</span>
                                        )}
                                    </div>

                                    <span
                                        className={`priority priority-${priorityLabels[task.priority].toLowerCase()}`}
                                    >
                                        {priorityLabels[task.priority]}
                                    </span>

                                    <span
                                        className={`task-status status-${statusLabels[task.status].toLowerCase().replace(' ', '-')}`}
                                    >
                                        {statusLabels[task.status]}
                                    </span>

                                    <span className="task-date">
                                        {formatDate(task.dueDate)}
                                    </span>

                                    <button
                                        type="button"
                                        className="action-button action-button--edit"
                                        onClick={() => openEditForm(task)}
                                        disabled={isSaving || deletingTaskId !== null}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="action-button action-button--delete"
                                        onClick={() => void handleDelete(task)}
                                        disabled={isSaving || deletingTaskId !== null}
                                    >
                                        {deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </main>
    )
}