import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router'
import '../App.css'

type HealthResponse = {
    status: string
    service: string
    timestamp: string
}

export default function AppLayout() {
    const [health, setHealth] = useState<HealthResponse | null>(null)
    const [apiError, setApiError] = useState(false)

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

    return (
        <div className='app-shell'>
            <aside className='sidebar'>
                <Link className='nav-item active' to='/'>
                    <span className='brand-mark'>T</span>
                    <span>TaskFlow</span>
                </Link>

                <p className='nav-label'>Workspace</p>

                <nav className='navigation' aria-label='Navegación principal'>
                    <NavLink
                        to='/'
                        end
                        className={({ isActive }) =>
                            `nav-item${isActive ? ' active' : ''}`
                        }
                    >
                        <span aria-hidden='true'>▦</span>
                        Dashboard
                    </NavLink>

                    <NavLink
                        to='/projects'
                        className={({ isActive }) =>
                            `nav-item${isActive ? ' active' : ''}`
                        }
                    >
                        <span aria-hidden='true'>▦</span>
                        Projects
                    </NavLink>

                    <NavLink
                        to='/tasks'
                        end
                        className={({ isActive }) =>
                            `nav-item${isActive ? ' active' : ''}`
                        }
                    >
                        <span aria-hidden='true'>▦</span>
                        Tasks
                    </NavLink>    
                </nav>

                <div className='sidebar-bottom'>
                    <div className='api-indicator'>
                        <span
                            className={`status-dot ${
                                health ? 'online' : apiError ? 'offline' : ''    
                            }`}
                        />
                        <div>
                            <strong>API Status</strong>
                            <small>
                                {health
                                    ? 'Conected'
                                    : apiError
                                        ? 'No Conected'
                                        : 'Comprobando...'}
                            </small>
                        </div>
                    </div>
                    <p className='version-label'>TaskFlow · MVP v0.1</p>
                </div>
            </aside>

            <Outlet context={{ health }}/>
        </div>
    )
}