import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import LoadingSpinner from './components/ui/LoadingSpinner';

const HomePage = lazy(() => import('./pages/HomePage'));
const TaskSetupPage = lazy(() => import('./pages/TaskSetupPage'));
const FocusTimerPage = lazy(() => import('./pages/FocusTimerPage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const TemplatesPage = lazy(() => import('./pages/TemplatesPage'));
const TemplateEditorPage = lazy(() => import('./pages/TemplateEditorPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const HistoryDetailPage = lazy(() => import('./pages/HistoryDetailPage'));
const PhotoCheckinPage = lazy(() => import('./pages/PhotoCheckinPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

function PageLoader() {
  return <LoadingSpinner size="lg" className="py-20" />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/setup" element={<TaskSetupPage />} />
          <Route path="/focus/:taskId" element={<FocusTimerPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/new" element={<TemplateEditorPage />} />
          <Route path="/templates/:templateId/edit" element={<TemplateEditorPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history/:date" element={<HistoryDetailPage />} />
          <Route path="/photo" element={<PhotoCheckinPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
