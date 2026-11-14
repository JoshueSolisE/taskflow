import { useEffect, useState } from "react"
import { Link } from 'react-router'
import { getProjects } from '../services/api'
import type { Project } from '../types/task'

export default function ProjectsPages() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    useEffect(() => {
        const controller = new AbortController()

        async function loadProjects() {
            try {
                setIsLoading(true)
                setError(null)

                const data = await getProjects({
                    signal: controller.signal,
                })

                setProjects(data)
            } catch {
                if (!controller.signal.aborted) {
                    setError('Projects cannot be loaded.')
                }
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false)
                }
            }
        }

        void loadProjects()

        return () => controller.abort()
    }, [])

    return (
        <main className="main-content">
            <header className="topbar">
                <div>
                    <h1>Projects</h1>
                    <p>Manage and organize your projects.</p>
                </div>
            </header>

            <section aria-label="Projects list">
                {isLoading && (
                    <p role="status">Loading projects...</p>
                )}

                {!isLoading && error && (
                    <div role="alert">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                        >
                            Retry
                        </button>
                    </div>
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
                                    'No description.'}
                                </p>

                                <small>
                                    Created at {' '}
                                    {new Date(
                                        project.createdAt,
                                    ).toLocaleDateString()}
                                </small>

                                <Link
                                    to={`/projects/${project.id}`}
                                >
                                    See project
                                </Link>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    )
}