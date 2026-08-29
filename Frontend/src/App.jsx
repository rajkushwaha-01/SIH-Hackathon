import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoadingState from './components/common/LoadingState';

// Lazy-loaded Authentication Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Lazy-loaded Application Pages for Optimal Performance & Code Splitting
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ReportsListPage = lazy(() => import('./pages/reports/ReportsListPage'));
const ReportUploadPage = lazy(() => import('./pages/reports/ReportUploadPage'));
const ReportAnalyzingPage = lazy(() => import('./pages/reports/ReportAnalyzingPage'));
const ReportDetailPage = lazy(() => import('./pages/reports/ReportDetailPage'));
const ReviewWorkspacePage = lazy(() => import('./pages/review/ReviewWorkspacePage'));
const SIFIntelligencePage = lazy(() => import('./pages/intelligence/SIFIntelligencePage'));
const PrecursorGraphPage = lazy(() => import('./pages/graph/PrecursorGraphPage'));
const WhatIfSimulatorPage = lazy(() => import('./pages/simulator/WhatIfSimulatorPage'));
const SimilarIncidentsPage = lazy(() => import('./pages/search/SimilarIncidentsPage'));
const RecurringPatternsPage = lazy(() => import('./pages/patterns/RecurringPatternsPage'));
const HseAlertsPage = lazy(() => import('./pages/alerts/HseAlertsPage'));
const HseCopilotPage = lazy(() => import('./pages/copilot/HseCopilotPage'));
const SafetyAnalyticsPage = lazy(() => import('./pages/analytics/SafetyAnalyticsPage'));
const AuditTrailPage = lazy(() => import('./pages/audit/AuditTrailPage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage'));

// ProtectedRoute component ensuring session validity and preserving location state
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <LoadingState
          message="Initializing Safety Intelligence Platform..."
          subtext="Validating authentication session..."
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// PublicOnlyRoute component ensuring logged-in users don't see login/register
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <LoadingState
          message="Initializing Safety Intelligence Platform..."
          subtext="Validating authentication session..."
        />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-surface">
          <LoadingState
            message="Initializing Safety Intelligence Platform..."
            subtext="Loading verified Stitch design system & AI precursor engines..."
          />
        </div>
      }
    >
      <Routes>
        {/* Public Authentication Routes (Outside AppLayout) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected Application Routes (Inside AppLayout) */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout user={user} onLogout={logout} />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsListPage />} />
          <Route path="/reports/upload" element={<ReportUploadPage />} />
          <Route path="/reports/analyzing" element={<ReportAnalyzingPage />} />
          <Route path="/reports/:id" element={<ReportDetailPage />} />
          <Route path="/review/:id" element={<ReviewWorkspacePage />} />
          <Route path="/intelligence" element={<SIFIntelligencePage />} />
          <Route path="/precursor-graph" element={<PrecursorGraphPage />} />
          <Route path="/risk-simulator" element={<WhatIfSimulatorPage />} />
          <Route path="/similar-incidents" element={<SimilarIncidentsPage />} />
          <Route path="/patterns" element={<RecurringPatternsPage />} />
          <Route path="/alerts" element={<HseAlertsPage />} />
          <Route path="/copilot" element={<HseCopilotPage />} />
          <Route path="/analytics" element={<SafetyAnalyticsPage />} />
          <Route path="/audit" element={<AuditTrailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}


