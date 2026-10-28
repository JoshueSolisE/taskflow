import { useEffect, useState } from 'react'

type HealthResponse = {
  status: string
  service: string
  timestamp: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err) {
        if (controller.signal.aborted) return

        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo conectar con la API',
        )
      }
    }

    void checkApi()

    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>TaskFlow</h1>
      <p>Tu espacio personal para organizar proyectos y tareas.</p>

      <section aria-labelledby="api-status">
        <h2 id="api-status">Estado del backend</h2>

        {health && (
          <p>
            API conectada: {health.service} ({health.status})
          </p>
        )}

        {error && (
          <p role="alert">
            No se pudo conectar con la API: {error}
          </p>
        )}

        {!health && !error && <p>Comprobando conexión...</p>}
      </section>
    </main>
  )
}

export default App
