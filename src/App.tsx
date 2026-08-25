import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const JobsPage = lazy(() =>
  import('./features/jobs/jobs-page').then((module) => ({
    default: module.JobsPage,
  })),
);
const MatchesPage = lazy(() =>
  import('./features/matches/matches-page').then((module) => ({
    default: module.MatchesPage,
  })),
);
const SourcesPage = lazy(() =>
  import('./features/sources/sources-page').then((module) => ({
    default: module.SourcesPage,
  })),
);
const TrackerPage = lazy(() =>
  import('./features/tracker/tracker-page').then((module) => ({
    default: module.TrackerPage,
  })),
);

export function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-canvas text-sm text-zinc-600">
          Loading workspace
        </div>
      }
    >
      <Routes>
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/sources" element={<SourcesPage />} />
        <Route path="/tracker" element={<TrackerPage />} />
        <Route path="/" element={<Navigate to="/matches" replace />} />
        <Route path="*" element={<Navigate to="/matches" replace />} />
      </Routes>
    </Suspense>
  );
}
