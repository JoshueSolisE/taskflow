
import { Fragment, useEffect, useState } from 'react'
import { createTask, deleteTask, getProjects, getProjectTasks, updateTask } from './services/api'
import type { CreateTaskInput, UpdateTaskInput } from './services/api'
import type { Project, Task as ApiTask } from './types/task'
import './App.css'

type HealthResponse = {
  status: string
  service: string
  timestamp: string
}

type DisplayTaskStatus = 'Pending' | 'In Progress' | 'Done'
type DisplayPriority = 'High' | 'Medium' | 'Low'
type Filter = 'All' | DisplayTaskStatus

type DashboardTask = {
  id: string
  title: string
  description: string
  projectId: string
  project: string
  status: DisplayTaskStatus
  priority: DisplayPriority
  dueDate: string
  dueDateISO: string
}

type DashboardProject = {
  id: string
  name: string
  description: string
  progress: number
  color: string
}

function mapStatus(status: ApiTask['status']): DisplayTaskStatus {
  const statuses: Record<ApiTask['status'], DisplayTaskStatus> = {
    TODO: 'Pending',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  }

  return statuses[status]
}

function mapPriority(priority: ApiTask['priority']): DisplayPriority {
  const priorities: Record<ApiTask['priority'], DisplayPriority> = {
    HIGH: 'High',
    MEDIUM: 'Medium',
    LOW: 'Low',
  }

  return priorities[priority]
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return 'No Date'

  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(dueDate))
}

function App() {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')
  const [newTaskStatus, setNewTaskStatus] =
    useState<CreateTaskInput['status']>('TODO')
  const [newTaskPriority, setNewTaskPriority] =
    useState<CreateTaskInput['priority']>('MEDIUM')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [creatingTask, setCreatingTask] = useState(false)
  const [createTaskError, setCreateTaskError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [apiError, setApiError] = useState(false)
  const [filter, setFilter] = useState<Filter>('All')
  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [tasksError, setTasksError] = useState<string | null>(null)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskStatus, setEditTaskStatus] =
    useState<CreateTaskInput['status']>('TODO')
  const [editTaskPriority, setEditTaskPriority] =
    useState<CreateTaskInput['priority']>('MEDIUM')
  const [editTaskDueDate, setEditTaskDueDate] = useState('')
  const [updatingTask, setUpdatingTask] = useState(false)
  const [updateTaskError, setUpdateTaskError] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [deletingTaskError, setDeletingTaskError] = useState<string | null>(null)


  useEffect(() => {
    const controller = new AbortController()

    async function checkApi() {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data: HealthResponse = await response.json()
        setHealth(data)
        setApiError(false)
      } catch {
        if (!controller.signal.aborted) {
          setApiError(true)
        }
      }
    }

    void checkApi()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    let active = true
    
    async function loadDashboard() {
      try {
        setLoadingTasks(true)
        setTasksError(null)

        const apiProjects = await getProjects()

        const results = await Promise.all(
          apiProjects.map(async (project: Project) => ({
            project,
            tasks: await getProjectTasks(project.id),
          })),
        )

        if (!active) return

        const projectNames = new Map(
          apiProjects.map((project) => [project.id, project.name]),
        )

        const dashboardTasks: DashboardTask[] = results.flatMap(
          ({ tasks: projectTasks }) => 
            projectTasks.map((task: ApiTask) => ({
            id: task.id,
            title: task.title,
            description: task.description ?? '',
            projectId: task.projectId,
            project: projectNames.get(task.projectId) ?? 'Unknown Project',
            status: mapStatus(task.status),
            priority: mapPriority(task.priority),
            dueDate: formatDueDate(task.dueDate),
            dueDateISO: task.dueDate
              ? task.dueDate.slice(0, 10)
              : '',
          })),
        )

        const dashboardProjects: DashboardProject[] = results.map(
          ({ project, tasks: projectTasks }, index) => {
            const completed = projectTasks.filter(
              (task) => task.status === 'DONE',
            ).length

            return {
              id: project.id,
              name: project.name,
              description: project.description ?? 'No Description',
              progress:
                projectTasks.length === 0
                  ? 0
                  : Math.round((completed / projectTasks.length) * 100),
              color: ['purple', 'blue', 'green'][index % 3],
            }
          },
        )

        setProjects(dashboardProjects)
        setTasks(dashboardTasks)
      } catch (error) {
        if (active) {
          setTasksError(
            error instanceof Error
              ? error.message
              : 'Data can not be loaded',
          )
        }
      } finally {
        if (active) setLoadingTasks(false)
      }
    }

    void loadDashboard()

    return () => {
      active = false
    }
  }, [])

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = newTaskTitle.trim()

    if (!title) {
      setCreateTaskError('Task title is required.')
      return
    }

    if (!selectedProjectId) {
      setCreateTaskError('Please select a project.')
      return
    }

    const input: CreateTaskInput = {
      title,
      description: newTaskDescription.trim() || undefined,
      status: newTaskStatus,
      priority: newTaskPriority,
      dueDate: newTaskDueDate
        ? new Date(`${newTaskDueDate}T12:00:00`).toISOString()
        : undefined,
    }

    try {
      setCreatingTask(true)
      setCreateTaskError(null)

      const createdTask = await createTask(selectedProjectId, input)
      const selectedProject = projects.find(
        (project) => project.id === selectedProjectId,
      )

      const dashboardTask: DashboardTask = {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description ?? '',
        projectId: createdTask.projectId,
        project: selectedProject?.name ?? 'Unknown Project',
        status: mapStatus(createdTask.status),
        priority: mapPriority(createdTask.priority),
        dueDate: formatDueDate(createdTask.dueDate),
        dueDateISO: createdTask.dueDate
          ? createdTask.dueDate.slice(0, 10)
          : '',
      }

      setTasks((currentTasks) => [dashboardTask, ...currentTasks])

      setProjects((currentProjects) =>
        currentProjects.map((project) => {
          if (project.id !== selectedProjectId) return project

          const projectTasks = [
            ...tasks.filter((task) => task.project === project.name),
            dashboardTask,
          ]
          const completed = projectTasks.filter(
            (task) => task.status === 'Done',
          ).length

          return {
            ...project,
            progress: Math.round((completed / projectTasks.length) * 100),
          }
        }),
      )

      setNewTaskTitle('')
      setNewTaskDescription('')
      setNewTaskStatus('TODO')
      setNewTaskPriority('MEDIUM')
      setNewTaskDueDate('')
      setShowCreateForm(false)
    } catch (error) {
      setCreateTaskError(
        error instanceof Error ? error.message: 'Could not create task.',
      )
    } finally {
      setCreatingTask(false)
    }
  }

  function startEditingTask(task: DashboardTask) {
    setEditingTaskId(task.id)
    setEditTaskTitle(task.title)
    setEditTaskDescription(task.description)
    setEditTaskStatus(
      task.status === 'Pending'
        ? 'TODO'
        : task.status === 'In Progress'
          ? 'IN_PROGRESS'
          : 'DONE',
    )
    setEditTaskPriority(
      task.priority === 'High'
        ? 'HIGH'
        : task.priority === 'Medium'
          ? 'MEDIUM'
          : 'LOW',
    )
    setEditTaskDueDate(task.dueDateISO)
    setUpdateTaskError(null)
  }

  async function handleUpdateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingTaskId) return

    const title = editTaskTitle.trim()

    if (!title) {
      setUpdateTaskError('Task title is required.')
      return
    }

    const input: UpdateTaskInput = {
      title,
      description: editTaskDescription.trim(),
      status: editTaskStatus,
      priority: editTaskPriority,
      dueDate: editTaskDueDate
        ? new Date(`${editTaskDueDate}T12:00:00`).toISOString()
        : undefined,
    }

    try {
      setUpdatingTask(true)
      setUpdateTaskError(null)

      const updatedTask = await updateTask(editingTaskId, input)

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === updatedTask.id
            ? {
                ...task,
                title: updatedTask.title,
                description: updatedTask.description ?? '',
                projectId: updatedTask.projectId,
                status: mapStatus(updatedTask.status),
                priority: mapPriority(updatedTask.priority),
                dueDate: formatDueDate(updatedTask.dueDate),
                dueDateISO: updatedTask.dueDate
                  ? updatedTask.dueDate.slice(0, 10)
                  : '',
              }
            : task,
        ),
      )

      const updatedStatuses = new Map(
        tasks.map((task) => [task.id, task.status]),
      )
      updatedStatuses.set(updatedTask.id, mapStatus(updatedTask.status))

      setProjects((currentProjects) =>
        currentProjects.map((project) => {
          const projectTasks = tasks.filter(
            (task) => task.projectId === project.id,
          )

          const completed = projectTasks.filter(
            (task) => updatedStatuses.get(task.id) === 'Done',
          ).length

          return {
            ...project,
            progress: projectTasks.length
              ? Math.round((completed / projectTasks.length) * 100)
              : 0,
          }
        }),
      )

      setEditingTaskId(null)
    } catch (error) {
      setUpdateTaskError(
        error instanceof Error ? error.message : 'Could not update task.',
      )
    } finally {
      setUpdatingTask(false)
    }
  }

  async function handleDeleteTask(task: DashboardTask) {
    const  confirmed = window.confirm(
      `Are you sure you wnat to delete "${task.title}"?. This action cannot be undone`,
    )
    
    if (!confirmed) return

    try {
      setDeletingTaskId(task.id)
      setDeletingTaskError(null)

      await deleteTask(task.id)

      const remainingTasks = tasks.filter(
        (currentTask) => currentTask.id !== task.id
      )

      setTasks(remainingTasks)

      setProjects((currentProjects) =>
        currentProjects.map((project) => {
          const projectTasks = remainingTasks.filter(
            (currentTask) => currentTask.projectId === project.id,
          )

          const completedTasks = projectTasks.filter(
            (currentTask) => currentTask.status === 'Done',
          ).length

          return {
            ...project,
            progress:
              projectTasks.length > 0
                ? Math.round((completedTasks / projectTasks.length) * 100)
                : 0,
          }
        }),
      )

      if  (editingTaskId === task.id) {
        setEditingTaskId(null)
      }

    } catch (error) {
      setDeletingTaskError(
        error instanceof Error ? error.message : 'Could not delete task',
      )
    } finally {
      setDeletingTaskId(null)
    }
  }

  const filteredTasks =
    filter === 'All'
      ? tasks
      : tasks.filter((task) => task.status === filter)

  const completedTasks = tasks.filter(
    (task) => task.status === 'Done',
  ).length

  const inProgressTasks = tasks.filter(
    (task) => task.status === 'In Progress',
  ).length

  const pendingTasks = tasks.filter(
    (task) => task.status === 'Pending',
  ).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio">
          <span className="brand-mark">T</span>
          <span>TaskFlow</span>
        </a>

        <p className="nav-label">Workspace</p>

        <nav className="navigation" aria-label="Navegación principal">
          <a className="nav-item active" href="#inicio">
            <span aria-hidden="true">▦</span>
            Dashboard
          </a>
          <a className="nav-item" href="#proyectos">
            <span aria-hidden="true">◫</span>
            Proyects
          </a>
          <a className="nav-item" href="#tareas">
            <span aria-hidden="true">✓</span>
            My Tasks
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="api-indicator">
            <span
              className={`status-dot ${health ? 'online' : apiError ? 'offline' : ''}`}
            />
            <div>
              <strong>API Status</strong>
              <small>
                {health ? 'Conectada' : apiError ? 'Sin conexión' : 'Comprobando...'}
              </small>
            </div>
          </div>
          <p className="version-label">TaskFlow · MVP v0.1</p>
        </div>
      </aside>

      <main className="main-content" id="inicio">
        <header className="topbar">
          <span className="breadcrumb">Personal Space / Dashboard</span>
          <span className="user-avatar" aria-label="Perfil de usuario">U</span>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h1>Dashboard</h1>
              <p className="muted">
                Organize your projects and move forward step by step.
              </p>
            </div>
            <span className="today-label">
              {new Intl.DateTimeFormat('es-MX', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(new Date())}
            </span>
          </section>

          <section className="stats-grid" aria-label="Resumen de tareas">
            <article className="stat-card">
              <div className="stat-heading">
                <span>Total Tasks</span>
                <span className="stat-icon purple-icon">▤</span>
              </div>
              <strong className="stat-number">{tasks.length}</strong>
              <span className="stat-caption">All Your Proyects</span>
            </article>

            <article className="stat-card">
              <div className="stat-heading">
                <span>Pendings</span>
                <span className="stat-icon orange-icon">◷</span>
              </div>
              <strong className="stat-number">{pendingTasks}</strong>
              <span className="stat-caption">To begin with</span>
            </article>

            <article className="stat-card">
              <div className="stat-heading">
                <span>In Process</span>
                <span className="stat-icon blue-icon">↗</span>
              </div>
              <strong className="stat-number">{inProgressTasks}</strong>
              <span className="stat-caption">Currently underway</span>
            </article>

            <article className="stat-card">
              <div className="stat-heading">
                <span>Completed</span>
                <span className="stat-icon green-icon">✓</span>
              </div>
              <strong className="stat-number">{completedTasks}</strong>
              <span className="stat-caption">Work completed</span>
            </article>
          </section>

          <section className="section-block" id="proyectos">
            <div className="section-heading">
              <div>
                <h2>Your Proyects</h2>
                <p className="muted">A look at what you have underway.</p>
              </div>
              <span className="section-count">{projects.length} proyects</span>
            </div>

            <div className="projects-grid">
              {projects.map((project) => (
                <article className="project-card" key={project.id}>
                  <div className={`project-symbol ${project.color}`}>
                    {project.name.charAt(0)}
                  </div>
                  <h3>{project.name}</h3>
                  <p className="project-description">{project.description}</p>
                  <div className="progress-label">
                    <span>Progress</span>
                    <strong>{project.progress}%</strong>
                  </div>
                  <div
                    className="progress-track"
                    role="progressbar"
                    aria-label={`Progreso de ${project.name}`}
                    aria-valuenow={project.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`progress-fill ${project.color}`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section-block tasks-section" id="tareas">
            <div className="section-heading">
              <div>
                <h2>Recent tasks</h2>
                <p className="muted">Keep up the pace and keep moving forward.</p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setCreateTaskError(null)
                  setSelectedProjectId((current) => current || projects[0]?.id || '')
                  setShowCreateForm((current) => !current)
                }}
                disabled={projects.length === 0}
              >
                + New Task
              </button>
            </div>
            {showCreateForm && (
              <form className="task-form" onSubmit={handleCreateTask}>
                <h3>Create Task</h3>

                <label>
                  Project
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(event.target.value)}
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Title
                  <input
                    value={newTaskTitle}
                    onChange={(event) => setNewTaskTitle(event.target.value)}
                    maxLength={200}
                    required
                    placeholder="e.g. Implement login"
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={newTaskDescription}
                    onChange={(event) => setNewTaskDescription(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Describe the task..."
                  />
                </label>

                <div className="task-form-grid">
                  <label>
                    Status
                    <select
                      value={newTaskStatus}
                      onChange={(event) =>
                        setNewTaskStatus(event.target.value as CreateTaskInput['status'])
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
                      value={newTaskPriority}
                      onChange={(event) =>
                        setNewTaskPriority(event.target.value as CreateTaskInput['priority'])
                      }
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </label>
                </div>

                <label>
                  Due Date
                  <input
                    type="date"
                    value={newTaskDueDate}
                    onChange={(event) => setNewTaskDueDate(event.target.value)}
                  />
                </label>

                {createTaskError && (
                  <p className="form-error" role="alert">
                    {createTaskError}
                  </p>
                )}

                <div className="task-form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setCreateTaskError(null)
                    }}
                    disabled={creatingTask}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={creatingTask || projects.length === 0}
                  >
                    {creatingTask ? 'Creating...' : 'Create Task'}
                  </button>
                </div>
              </form>
            )}
            <div className="task-filters" aria-label="Filtrar tareas">
              {(['All', 'Pending', 'In Progress', 'Done'] as Filter[]).map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    className={`filter-button ${filter === option ? 'selected' : ''}`}
                    aria-pressed={filter === option}
                    onClick={() => setFilter(option)}
                  >
                    {option}
                  </button>
                ),
              )}
            </div>
            {loadingTasks && (
              <p className="muted">Loading your tasks...</p>
            )}

            {tasksError && (
              <p role="alert" className="empty-state">
                Your tasks couldn't be loaded  {tasksError}
              </p>
            )}
            {deletingTaskError && (
              <p className='form-error' role='alert'>
                {deletingTaskError}
              </p>
            )}
            <div className="task-list">
              {filteredTasks.map((task) => (
                <Fragment>
                  <article className="task-row" key={task.id}>
                    <span
                      className={`task-check ${task.status === 'Done' ? 'checked' : ''}`}
                      aria-hidden="true"
                    >
                      {task.status === 'Done' ? '✓' : ''}
                    </span>
                    <div className="task-info">
                      <strong className={task.status === 'Done' ? 'task-done' : ''}>
                        {task.title}
                      </strong>
                      <span>{task.project}</span>
                    </div>
                    <span className={`priority priority-${task.priority.toLowerCase()}`}>
                      {task.priority}
                    </span>
                    <span className={`task-status status-${task.status.toLowerCase().replace(' ', '-')}`}>
                      {task.status}
                    </span>
                    <span className="task-date">{task.dueDate}</span>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => startEditingTask(task)}
                      disabled={updatingTask}
                    >
                      Edit
                    </button>
                    <button
                      type='button'
                      className='secondary-button'
                      onClick={() => void handleDeleteTask(task)}
                      disabled={deletingTaskId != null || updatingTask}
                    >
                      { deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </article>
                  {editingTaskId === task.id && (
                    <form className="task-form" onSubmit={handleUpdateTask}>
                      <h3>Edit Task</h3>

                      <label>
                        Title
                        <input
                          value={editTaskTitle}
                          onChange={(event) => setEditTaskTitle(event.target.value)}
                          maxLength={200}
                          required
                        />
                      </label>

                      <label>
                        Description
                        <textarea
                          value={editTaskDescription}
                          onChange={(event) => setEditTaskDescription(event.target.value)}
                          maxLength={2000}
                          rows={3}
                        />
                      </label>

                      <div className="task-form-grid">
                        <label>
                          Status
                          <select
                            value={editTaskStatus}
                            onChange={(event) =>
                              setEditTaskStatus(event.target.value as CreateTaskInput['status'])
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
                            value={editTaskPriority}
                            onChange={(event) =>
                              setEditTaskPriority(event.target.value as CreateTaskInput['priority'])
                            }
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </label>
                      </div>

                      <label>
                        Due Date
                        <input
                          type="date"
                          value={editTaskDueDate}
                          onChange={(event) => setEditTaskDueDate(event.target.value)}
                        />
                      </label>

                      {updateTaskError && (
                        <p className="form-error" role="alert">
                          {updateTaskError}
                        </p>
                      )}

                      <div className="task-form-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setEditingTaskId(null)
                            setUpdateTaskError(null)
                          }}
                          disabled={updatingTask}
                        >
                          Cancel
                        </button>

                        <button
                          type="submit"
                          className="primary-button"
                          disabled={updatingTask}
                        >
                          {updatingTask ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  )}
                </Fragment>
              ))}

              {!loadingTasks && !tasksError && filteredTasks.length === 0 && (
                <p className="empty-state">There are no tasks for this filter.</p>
              )}
            </div>
          </section>

          <footer className="page-footer">
            Building TaskFlow step by step.
            {health && (
              <span> API: {health.service} · {health.status}</span>
            )}
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
