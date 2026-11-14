import { useParams } from 'react-router'

export default function ProjectDetailsPage() {
    const { projectId } = useParams()

    return(
        <section>
            <h1>Detalles del proyecto</h1>
            <p>Proyecto Seleccionado: { projectId }</p>
        </section>
    )
}