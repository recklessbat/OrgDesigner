import { useState } from 'react';
import { useOrg } from '../context/OrgContext';
import type { GradeLevel, LocationCostType } from '../types';

export function TopBar() {
  const {
    filterConfig, setFilterConfig,
    scenarios, currentScenario,
    saveScenario, loadScenario, updateScenario, resetToBaseline,
    selectedNodes, clearSelection,
    vizConfig, setVizConfig,
  } = useOrg();

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showVizDropdown, setShowVizDropdown] = useState(false);

  const handleSave = () => {
    if (scenarioName.trim()) {
      saveScenario(scenarioName.trim(), scenarioDesc.trim());
      setScenarioName('');
      setScenarioDesc('');
      setShowSaveModal(false);
    }
  };

  const gradeOptions: GradeLevel[] = ['Associate', 'Senior Associate', 'VP', 'ED', 'MD'];
  const costOptions: LocationCostType[] = ['High', 'Mid', 'Low'];
  const colorByOptions: { value: typeof vizConfig.colorBy; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'grade', label: 'Grade Level' },
    { value: 'locationCost', label: 'Location Cost' },
    { value: 'jobFunction', label: 'Job Function' },
    { value: 'aiImpact', label: 'AI Impact' },
    { value: 'status', label: 'Status' },
  ];

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-left">
          <div className="app-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <line x1="10" y1="6.5" x2="14" y2="6.5" />
              <line x1="6.5" y1="10" x2="6.5" y2="14" />
            </svg>
            <span className="app-title">OrgDesigner</span>
          </div>

          <div className="search-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search employees, managers, positions..."
              value={filterConfig.searchQuery}
              onChange={e => setFilterConfig({ ...filterConfig, searchQuery: e.target.value })}
            />
            {filterConfig.searchQuery && (
              <button className="search-clear" onClick={() => setFilterConfig({ ...filterConfig, searchQuery: '' })}>
                &times;
              </button>
            )}
          </div>

          <div className="filter-group">
            <div className="dropdown-wrapper">
              <button
                className={`top-btn ${showFilterDropdown ? 'active' : ''}`}
                onClick={() => { setShowFilterDropdown(!showFilterDropdown); setShowVizDropdown(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                Filters
                {(filterConfig.gradeLevels.length > 0 || filterConfig.locationCostTypes.length > 0 || !filterConfig.includeContractors) && (
                  <span className="filter-badge">
                    {filterConfig.gradeLevels.length + filterConfig.locationCostTypes.length + (!filterConfig.includeContractors ? 1 : 0)}
                  </span>
                )}
              </button>
              {showFilterDropdown && (
                <div className="dropdown-panel filter-panel" onClick={e => e.stopPropagation()}>
                  <div className="dropdown-section">
                    <label className="dropdown-section-title">Grade Levels</label>
                    {gradeOptions.map(g => (
                      <label key={g} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filterConfig.gradeLevels.includes(g)}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...filterConfig.gradeLevels, g]
                              : filterConfig.gradeLevels.filter(x => x !== g);
                            setFilterConfig({ ...filterConfig, gradeLevels: next });
                          }}
                        />
                        {g}
                      </label>
                    ))}
                  </div>
                  <div className="dropdown-section">
                    <label className="dropdown-section-title">Location Cost</label>
                    {costOptions.map(c => (
                      <label key={c} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={filterConfig.locationCostTypes.includes(c)}
                          onChange={e => {
                            const next = e.target.checked
                              ? [...filterConfig.locationCostTypes, c]
                              : filterConfig.locationCostTypes.filter(x => x !== c);
                            setFilterConfig({ ...filterConfig, locationCostTypes: next });
                          }}
                        />
                        {c} Cost
                      </label>
                    ))}
                  </div>
                  <div className="dropdown-section">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filterConfig.includeContractors}
                        onChange={e => setFilterConfig({ ...filterConfig, includeContractors: e.target.checked })}
                      />
                      Include Contractors
                    </label>
                  </div>
                  <button className="clear-filters-btn" onClick={() => setFilterConfig({
                    ...filterConfig,
                    gradeLevels: [],
                    locationCostTypes: [],
                    includeContractors: true,
                    jobFunctions: [],
                    jobFamilies: [],
                    exceptionsOnly: false,
                  })}>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>

            <div className="dropdown-wrapper">
              <button
                className={`top-btn ${showVizDropdown ? 'active' : ''}`}
                onClick={() => { setShowVizDropdown(!showVizDropdown); setShowFilterDropdown(false); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                Display
              </button>
              {showVizDropdown && (
                <div className="dropdown-panel viz-panel" onClick={e => e.stopPropagation()}>
                  <div className="dropdown-section">
                    <label className="dropdown-section-title">Color By</label>
                    <select
                      className="select-input"
                      value={vizConfig.colorBy}
                      onChange={e => setVizConfig({ ...vizConfig, colorBy: e.target.value as typeof vizConfig.colorBy })}
                    >
                      {colorByOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="dropdown-section">
                    <label className="dropdown-section-title">Show in Nodes</label>
                    {[
                      { key: 'showGradeLevel' as const, label: 'Grade Level' },
                      { key: 'showLocationCost' as const, label: 'Location Cost' },
                      { key: 'showJobFunction' as const, label: 'Job Function' },
                      { key: 'showAiImpact' as const, label: 'AI Impact' },
                      { key: 'showPerformance' as const, label: 'Performance' },
                      { key: 'showManagerQuality' as const, label: 'Manager Quality' },
                    ].map(item => (
                      <label key={item.key} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={vizConfig[item.key]}
                          onChange={e => setVizConfig({ ...vizConfig, [item.key]: e.target.checked })}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                  <div className="dropdown-section">
                    <label className="dropdown-section-title">Exceptions</label>
                    {[
                      { key: 'showStovepipes' as const, label: 'Stovepipes' },
                      { key: 'showLowSpan' as const, label: 'Low Span' },
                      { key: 'showExceptions' as const, label: 'All Exceptions' },
                    ].map(item => (
                      <label key={item.key} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={vizConfig[item.key]}
                          onChange={e => setVizConfig({ ...vizConfig, [item.key]: e.target.checked })}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="top-bar-right">
          {selectedNodes.size > 0 && (
            <div className="selection-badge" onClick={clearSelection}>
              {selectedNodes.size} selected &times;
            </div>
          )}

          <div className="scenario-controls">
            <select
              className="scenario-select"
              value={currentScenario?.id || ''}
              onChange={e => {
                if (e.target.value) loadScenario(e.target.value);
              }}
            >
              <option value="">-- Load Scenario --</option>
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}{s.isBaseline ? ' (Baseline)' : ''}
                </option>
              ))}
            </select>

            {currentScenario && !currentScenario.isBaseline && (
              <button className="top-btn" onClick={() => updateScenario(currentScenario.id)} title="Update current scenario">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Update
              </button>
            )}

            <button className="top-btn primary" onClick={() => setShowSaveModal(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Save As
            </button>

            <button className="top-btn" onClick={resetToBaseline} title="Reset to baseline">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Save Scenario</h3>
            <input
              className="modal-input"
              placeholder="Scenario name"
              value={scenarioName}
              onChange={e => setScenarioName(e.target.value)}
              autoFocus
            />
            <textarea
              className="modal-textarea"
              placeholder="Description (optional)"
              value={scenarioDesc}
              onChange={e => setScenarioDesc(e.target.value)}
            />
            <div className="modal-actions">
              <button className="top-btn" onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button className="top-btn primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
