
import { useEffect, useState } from 'react'
import { getProjects, getProjectTasks } from './services/api'
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
  project: string
  status: DisplayTaskStatus
  priority: DisplayPriority
  dueDate: string
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
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [apiError, setApiError] = useState(false)
  const [filter, setFilter] = useState<Filter>('All')
  const [projects, setProjects] = useState<DashboardProject[]>([])
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [tasksError, setTasksError] = useState<string | null>(null)

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
              project: projectNames.get(task.projectId) ?? 'Unknown Proyect',
              status: mapStatus(task.status),
              priority: mapPriority(task.priority),
              dueDate: formatDueDate(task.dueDate),
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
            </div>

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
            <div className="task-list">
              {filteredTasks.map((task) => (
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
                </article>
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
