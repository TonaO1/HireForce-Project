import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute, RoleRoute } from './routes/ProtectedRoute';
import { HRLayout } from './components/layout/HRLayout';
import { ApplicantLayout } from './components/layout/ApplicantLayout';
import { LoginPage } from './pages/LoginPage';
import { HRDashboardPage } from './pages/hr/HRDashboardPage';
import { CandidateDetailPage } from './pages/hr/CandidateDetailPage';
import { JobsPage } from './pages/hr/JobsPage';
import { InterviewsPage } from './pages/hr/InterviewsPage';
import { OnboardingPage } from './pages/hr/OnboardingPage';
import { ApplyPage } from './pages/applicant/ApplyPage';
import { MyApplicationPage } from './pages/applicant/MyApplicationPage';
import { BookInterviewPage } from './pages/applicant/BookInterviewPage';

function RootRedirect() {
  const { user, role } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'hr' ? '/hr' : '/apply'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RootRedirect />} />

      <Route
        path="/hr"
        element={
          <ProtectedRoute>
            <RoleRoute allowed="hr">
              <HRLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route index element={<HRDashboardPage />} />
        <Route path="candidates/:id" element={<CandidateDetailPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <RoleRoute allowed="applicant">
              <ApplicantLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/my-application" element={<MyApplicationPage />} />
        <Route path="/book-interview" element={<BookInterviewPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
