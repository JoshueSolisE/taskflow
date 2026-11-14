import { useEffect, useState } from "react"
import { Link } from 'react-router'
import { 
    createProject,
    deleteProject,
    getProjects,
    updateProject,
} from '../services/api'
import type { Project } from '../types/task'

export default function ProjectsPages() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [editingProject, setEditingProject] = useState<Project |null>(null)
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    async function loadProjects() {
        try {
            setError(null)
            const data = await getProjects()
            setProjects(data)
        } catch {
            setError('No se pudieron cargar los proyectos.')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        const controller = new AbortController()

        getProjects({ signal: controller.signal })
            .then((data) => {
                if (!controller.signal.aborted) {
                    setProjects(data)
                }
            })
            .catch(() => {
                if (!controller.signal.aborted) {
                    setError('No se pudieron cargar los proyectos.')
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            })

        return () => controller.abort()
    }, [])

    function openCreateForm() {
        setEditingProject(null)
        setName('')
        setDescription('')
        setError(null)
        setSuccess(null)
        setShowForm(true)
    }

    function openEditForm(project: Project) {
        setEditingProject(project)
        setName(project.name)
        setDescription(project.description ?? '')
        setError(null)
        setSuccess(null)
        setShowForm(true)
    }

    function closeForm() {
        setShowForm(false)
        setEditingProject(null)
        setName('')
        setDescription('')
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmedName = name.trim()
        const trimmedDescription = description.trim()

        if (!trimmedName) {
            setError('Name for the project is required.')
            return
        }

        setIsSaving(true)
        setError(null)
        setSuccess(null)

        try {
            const input = {
                name: trimmedName,
                description: trimmedDescription || undefined,
            }

            if (editingProject) {
                await updateProject(editingProject.id, input)
                setSuccess('project updated successfully.')
            } else {
                await createProject(input)
                setSuccess('Project created successfully')
            }

            closeForm()
            await loadProjects()
        } catch {
            setError(
                editingProject
                    ? 'Porject cannot be updated'
                    : 'Project cannot be created',
            )
        } finally {
            setIsSaving(false)
        }
    }
    
    async function handleDelete(project: Project) {
        const confirmed = window.confirm(
            `Arew you sure that you want to delete this project: "${project.name}"?`,
        )

        if (!confirmed) {
            return
        }

        setDeletingId(project.id)
        setError(null)
        setSuccess(null)

        try {
            await deleteProject(project.id)
            setProjects((current) =>
                current.filter((item) => item.id !== project.id),
            )
            setSuccess('Proyecto eliminado correctamente.')

            if (editingProject?.id === project.id) {
                closeForm()
            }
        } catch {
            setError('No se pudo eliminar el proyecto.')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <main className="main-content">
            <header className="topbar">
                <div>
                    <h1>Projects</h1>
                    <p>Manage and organize your projects.</p>
                </div>
                <button type="button" onClick={openCreateForm}>
                    New Project
                </button>
            </header>

            {error && <p role="alert">{error}</p>}
            {success && <p role="status">{success}</p>}

            {showForm && (
                <section aria-label="Projects form">
                    <h2>
                        {editingProject
                            ? 'Edit project'
                            : 'Create project'}
                    </h2>

                    <form onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="project-name">
                                Name
                            </label>
                            <input
                                id="project-name"
                                name="name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                maxLength={120}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="project-description">
                                Description
                            </label>
                            <textarea
                                id="project-description"
                                name="description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                maxLength={2000}
                                rows={4}
                            />
                        </div>

                        <button type="submit" disabled={isSaving}>
                            {isSaving
                                ? 'Loading...'
                                : editingProject
                                    ? 'Load changes'
                                    : 'Create project'}
                        </button>

                        <button 
                            type="button"
                            onClick={closeForm}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                    </form>
                </section>
            )}

            <section aria-label="Projects list">
                {isLoading && (
                    <p role="status">Loading projects...</p>
                )}

                {!isLoading && !error && projects.length === 0 && (
                    <p>
                        You don't have proyects yet. When you create a proyect,
                        it should appear here. 
                    </p>
                )}

                {!isLoading && !error && projects.length > 0 && (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <article
                                className="project-card"
                                key={project.id}
                            >
                                <h2>{project.name}</h2>

                                <p>
                                    {project.description ||
                                        'N/A description.'}
                                </p>

                                <small>
                                    Created at {' '}
                                    {new Date(
                                        project.createdAt,
                                    ).toLocaleDateString()}
                                </small>

                                <div>
                                    <Link
                                        to={`/projects/${project.id}`}
                                    >
                                        See project
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            openEditForm(project)
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            void handleDelete(project)
                                        }
                                        disabled={
                                            deletingId === project.id
                                        }
                                    >
                                        {deletingId === project.id
                                            ? 'Deleting...'
                                            : 'Delete'}
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}