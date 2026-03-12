import { OrgProvider } from './context/OrgContext';
import { TopBar } from './components/TopBar';
import { OrgTree } from './components/OrgTree';
import { ChangeTracker } from './components/ChangeTracker';
import { MetricsDashboard } from './components/MetricsDashboard';
import { BulkActions } from './components/BulkActions';
import './App.css';

function App() {
  return (
    <OrgProvider>
      <div className="app-layout">
        <TopBar />
        <div className="main-content">
          <ChangeTracker />
          <OrgTree />
          <MetricsDashboard />
        </div>
        <BulkActions />
      </div>
    </OrgProvider>
  );
}

export default App;
