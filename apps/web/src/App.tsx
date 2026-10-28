
import { useEffect, useState } from 'react'
import './App.css'

type HealthResponse = {
  status: string
  service: string
  timestamp: string
}

type TaskStatus = 'Pendiente' | 'En progreso' | 'Completada'

type Task = {
  id: number
  title: string
  project: string
  status: TaskStatus
  priority: 'Alta' | 'Media' | 'Baja'
  dueDate: string
}

const projects = [
  { id: 1, name: 'TaskFlow', description: 'Aplicación de gestión de tareas', progress: 35, color: 'purple' },
  { id: 2, name: 'Portfolio personal', description: 'Preparación para entrevistas', progress: 60, color: 'blue' },
  { id: 3, name: 'Aprendizaje TypeScript', description: 'Práctica y ejercicios', progress: 80, color: 'green' },
]

const initialTasks: Task[] = [
  { id: 1, title: 'Configurar la estructura del proyecto', project: 'TaskFlow', status: 'Completada', priority: 'Alta', dueDate: 'Hoy' },
  { id: 2, title: 'Diseñar el dashboard principal', project: 'TaskFlow', status: 'En progreso', priority: 'Alta', dueDate: 'Hoy' },
  { id: 3, title: 'Definir el modelo de datos', project: 'TaskFlow', status: 'Pendiente', priority: 'Media', dueDate: 'Mañana' },
  { id: 4, title: 'Practicar tipos e interfaces', project: 'Aprendizaje TypeScript', status: 'En progreso', priority: 'Media', dueDate: '30 oct.' },
  { id: 5, title: 'Actualizar el CV', project: 'Portfolio personal', status: 'Pendiente', priority: 'Alta', dueDate: '31 oct.' },
]

type Filter = 'Todas' | TaskStatus

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [apiError, setApiError] = useState(false)
  const [filter, setFilter] = useState<Filter>('Todas')

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

  const filteredTasks =
    filter === 'Todas'
      ? initialTasks
      : initialTasks.filter((task) => task.status === filter)

  const completedTasks = initialTasks.filter(
    (task) => task.status === 'Completada',
  ).length

  const inProgressTasks = initialTasks.filter(
    (task) => task.status === 'En progreso',
  ).length

  const pendingTasks = initialTasks.filter(
    (task) => task.status === 'Pendiente',
  ).length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inicio">
          <span className="brand-mark">T</span>
          <span>TaskFlow</span>
        </a>

        <p className="nav-label">ESPACIO DE TRABAJO</p>

        <nav className="navigation" aria-label="Navegación principal">
          <a className="nav-item active" href="#inicio">
            <span aria-hidden="true">▦</span>
            Dashboard
          </a>
          <a className="nav-item" href="#proyectos">
            <span aria-hidden="true">◫</span>
            Proyectos
          </a>
          <a className="nav-item" href="#tareas">
            <span aria-hidden="true">✓</span>
            Mis tareas
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="api-indicator">
            <span
              className={`status-dot ${health ? 'online' : apiError ? 'offline' : ''}`}
            />
            <div>
              <strong>Estado de la API</strong>
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
          <span className="breadcrumb">Espacio personal / Dashboard</span>
          <span className="user-avatar" aria-label="Perfil de usuario">U</span>
        </header>

        <div className="page-content">
          <section className="welcome-section">
            <div>
              <p className="eyebrow">TU ESPACIO DE TRABAJO</p>
              <h1>Dashboard</h1>
              <p className="muted">
                Organiza tus proyectos y avanza un paso a la vez.
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
                <span>Total de tareas</span>
                <span className="stat-icon purple-icon">▤</span>
              </div>
              <strong className="stat-number">{initialTasks.length}</strong>
              <span className="stat-caption">En todos tus proyectos</span>
            </article>

            <article className="stat-card">
              <div className="stat-heading">
                <span>Pendientes</span>
                <span className="stat-icon orange-icon">◷</span>
              </div>
              <strong className="stat-number">{pendingTasks}</strong>
              <span className="stat-caption">Por comenzar</span>
            </article>

            <article className="stat-card">
              <div className="stat-heading">
                <span>En progreso</span>
                <span className="stat-icon blue-icon">↗</span>
              </div>
              <strong className="stat-number">{inProgressTasks}</strong>
              <span className="stat-caption">Actualmente en marcha</span>
            </article>

            <article className="stat-card">
              <div className="stat-heading">
                <span>Completadas</span>
                <span className="stat-icon green-icon">✓</span>
              </div>
              <strong className="stat-number">{completedTasks}</strong>
              <span className="stat-caption">Trabajo terminado</span>
            </article>
          </section>

          <section className="section-block" id="proyectos">
            <div className="section-heading">
              <div>
                <h2>Tus proyectos</h2>
                <p className="muted">Un vistazo a lo que tienes en marcha.</p>
              </div>
              <span className="section-count">{projects.length} proyectos</span>
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
                    <span>Progreso</span>
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
                <h2>Tareas recientes</h2>
                <p className="muted">Mantén el ritmo y sigue avanzando.</p>
              </div>
            </div>

            <div className="task-filters" aria-label="Filtrar tareas">
              {(['Todas', 'Pendiente', 'En progreso', 'Completada'] as Filter[]).map(
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

            <div className="task-list">
              {filteredTasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <span
                    className={`task-check ${task.status === 'Completada' ? 'checked' : ''}`}
                    aria-hidden="true"
                  >
                    {task.status === 'Completada' ? '✓' : ''}
                  </span>
                  <div className="task-info">
                    <strong className={task.status === 'Completada' ? 'task-done' : ''}>
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

              {filteredTasks.length === 0 && (
                <p className="empty-state">No hay tareas para este filtro.</p>
              )}
            </div>
          </section>

          <footer className="page-footer">
            Construyendo TaskFlow paso a paso.
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
