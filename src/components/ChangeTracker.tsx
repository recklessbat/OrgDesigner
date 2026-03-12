import { useOrg } from '../context/OrgContext';

const CHANGE_TYPE_ICONS: Record<string, string> = {
  move: '↔',
  add: '+',
  remove: '×',
  modify: '✎',
  multi_modify: '✎✎',
};

const CHANGE_TYPE_COLORS: Record<string, string> = {
  move: '#3B82F6',
  add: '#10B981',
  remove: '#EF4444',
  modify: '#F59E0B',
  multi_modify: '#8B5CF6',
};

export function ChangeTracker() {
  const { changes, leftSidebarOpen, setLeftSidebarOpen } = useOrg();

  return (
    <>
      {/* Toggle button */}
      <button
        className={`sidebar-toggle left-toggle ${leftSidebarOpen ? 'open' : ''}`}
        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
        title="Change Tracker"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
        {changes.length > 0 && <span className="change-count">{changes.length}</span>}
      </button>

      {/* Sidebar */}
      <div className={`sidebar left-sidebar ${leftSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Change Tracker</h3>
          <span className="change-total">{changes.length} changes</span>
        </div>

        <div className="sidebar-content">
          {changes.length === 0 ? (
            <div className="sidebar-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>No changes recorded yet.</p>
              <p className="sidebar-hint">Drag nodes, add positions, or flag removals to see changes here.</p>
            </div>
          ) : (
            <div className="change-list">
              {changes.map(change => (
                <div key={change.id} className="change-item">
                  <div className="change-icon" style={{ backgroundColor: CHANGE_TYPE_COLORS[change.type] + '20', color: CHANGE_TYPE_COLORS[change.type] }}>
                    {CHANGE_TYPE_ICONS[change.type]}
                  </div>
                  <div className="change-details">
                    <div className="change-desc">{change.description}</div>
                    <div className="change-time">
                      {change.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {change.nodeIds.length > 1 && (
                        <span className="change-count-badge">{change.nodeIds.length} nodes</span>
                      )}
                    </div>
                    {change.newState && (
                      <div className="change-detail-row">
                        {Object.entries(change.newState).map(([key, val]) => (
                          <span key={key} className="change-detail-badge">
                            {key}: {String(val)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
