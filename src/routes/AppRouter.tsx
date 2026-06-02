import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthGuard, AdminGuard } from './AuthGuard'
import { StudentLayout } from '../components/layout/StudentLayout'
import { AdminLayout } from '../components/layout/AdminLayout'

import { LoginPage } from '../pages/LoginPage'

// Student pages
import { DashboardPage } from '../pages/student/DashboardPage'
import { LessonPage } from '../pages/student/LessonPage'

// Admin pages
import { AdminPlansPage } from '../pages/admin/AdminPlansPage'
import { AdminPlanFormPage } from '../pages/admin/AdminPlanFormPage'
import { AdminPlanDetailPage } from '../pages/admin/AdminPlanDetailPage'
import { AdminLessonFormPage } from '../pages/admin/AdminLessonFormPage'
import { AdminQuestionsPage } from '../pages/admin/AdminQuestionsPage'
import { AdminQuestionFormPage } from '../pages/admin/AdminQuestionFormPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Área do aluno — protegida */}
        <Route element={<AuthGuard />}>
          {/* Dashboard com layout lateral */}
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
          {/* Lições em tela cheia (intro + jogo + resultado numa página só) */}
          <Route path="/lesson/:lessonId" element={<LessonPage />} />
        </Route>

        {/* Área do admin — protegida */}
        <Route element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/plans" replace />} />
            <Route path="/admin/plans" element={<AdminPlansPage />} />
            <Route path="/admin/plans/new" element={<AdminPlanFormPage />} />
            <Route path="/admin/plans/:planId/edit" element={<AdminPlanFormPage />} />
            <Route path="/admin/plans/:planId" element={<AdminPlanDetailPage />} />
            <Route path="/admin/plans/:planId/lessons/new" element={<AdminLessonFormPage />} />
            <Route path="/admin/plans/:planId/lessons/:lessonId" element={<AdminLessonFormPage />} />
            <Route path="/admin/plans/:planId/lessons/:lessonId/questions" element={<AdminQuestionsPage />} />
            <Route path="/admin/plans/:planId/lessons/:lessonId/questions/new" element={<AdminQuestionFormPage />} />
            <Route path="/admin/plans/:planId/lessons/:lessonId/questions/:questionId" element={<AdminQuestionFormPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
