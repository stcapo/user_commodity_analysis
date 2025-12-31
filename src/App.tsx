import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { UserSegments } from './pages/UserSegments';
import { CategoryInsights } from './pages/CategoryInsights';
import { CohortAnalysis } from './pages/CohortAnalysis';
import { useTheme } from './hooks/useTheme';

function App() {
  const { version, switchVersion } = useTheme();

  return (
    <Router>
      <AppLayout version={version} onVersionChange={switchVersion}>
        <Routes>
          <Route path="/" element={<Dashboard version={version} />} />
          <Route path="/users" element={<UserSegments version={version} />} />
          <Route path="/category" element={<CategoryInsights version={version} />} />
          <Route path="/cohort" element={<CohortAnalysis version={version} />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;

