import { Route, Routes } from 'react-router'
import App from './App'
import AppLayout from './components/AppLayout'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import TasksPage from './pages/TasksPage'

export default function AppRouter() {
    return (
        <Routes>
            <Route element={<AppLayout/>}>
                <Route path='/' element={<App />} />
                <Route path='/projects' element={<ProjectsPage />} />
                <Route 
                    path='/projects/:projectId'
                    element={<ProjectDetailsPage />} 
                />
                <Route path='/tasks' element={<TasksPage />} />
            </Route>
        </Routes>
    )
}