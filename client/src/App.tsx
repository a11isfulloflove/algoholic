import { Navigate, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProblemPage } from './pages/ProblemPage'
import { ProblemsPage } from './pages/ProblemsPage'
import { RegisterPage } from './pages/RegisterPage'
import { SubmissionDetailPage } from './pages/SubmissionDetailPage'
import { SubmissionsPage } from './pages/SubmissionsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/problems" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/problems" element={<ProblemsPage />} />
        <Route path="/problems/:slug" element={<ProblemPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
