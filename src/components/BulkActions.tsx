import { useState } from 'react';
import { useOrg } from '../context/OrgContext';
import type { GradeLevel, LocationCostType } from '../types';

export function BulkActions() {
  const { selectedNodes, modifyNodes, employees, clearSelection } = useOrg();
  const [showPanel, setShowPanel] = useState(false);
  const [bulkLocation, setBulkLocation] = useState('');
  const [bulkCostType, setBulkCostType] = useState<LocationCostType | ''>('');
  const [bulkGrade, setBulkGrade] = useState<GradeLevel | ''>('');

  if (selectedNodes.size < 2) return null;

  const handleApply = () => {
    const changes: Record<string, unknown> = {};
    if (bulkLocation) changes.location = bulkLocation;
    if (bulkCostType) changes.locationCostType = bulkCostType;
    if (bulkGrade) changes.gradeLevel = bulkGrade;

    if (Object.keys(changes).length > 0) {
      modifyNodes(Array.from(selectedNodes), changes);
      setShowPanel(false);
      setBulkLocation('');
      setBulkCostType('');
      setBulkGrade('');
    }
  };

  const locations = [
    { name: 'New York, NY', cost: 'High' as LocationCostType },
    { name: 'London, UK', cost: 'High' as LocationCostType },
    { name: 'San Francisco, CA', cost: 'High' as LocationCostType },
    { name: 'Chicago, IL', cost: 'Mid' as LocationCostType },
    { name: 'Dallas, TX', cost: 'Mid' as LocationCostType },
    { name: 'Charlotte, NC', cost: 'Mid' as LocationCostType },
    { name: 'Bengaluru, India', cost: 'Low' as LocationCostType },
    { name: 'Manila, Philippines', cost: 'Low' as LocationCostType },
    { name: 'Warsaw, Poland', cost: 'Low' as LocationCostType },
  ];

  return (
    <div className="bulk-actions-bar">
      <div className="bulk-info">
        <span className="bulk-count">{selectedNodes.size} nodes selected</span>
      </div>
      <div className="bulk-buttons">
        <button className="bulk-btn" onClick={() => setShowPanel(!showPanel)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Bulk Edit
        </button>
        <button className="bulk-btn danger" onClick={() => {
          Array.from(selectedNodes).forEach(id => {
            const emp = employees.find(e => e.id === id);
            if (emp) {
              // Will handle through context
            }
          });
        }}>
          Flag Selected for Removal
        </button>
        <button className="bulk-btn outline" onClick={clearSelection}>
          Clear Selection
        </button>
      </div>

      {showPanel && (
        <div className="bulk-edit-panel">
          <h4>Bulk Modify {selectedNodes.size} Employees</h4>
          <div className="bulk-field">
            <label>Relocate To</label>
            <select value={bulkLocation} onChange={e => {
              setBulkLocation(e.target.value);
              const loc = locations.find(l => l.name === e.target.value);
              if (loc) setBulkCostType(loc.cost);
            }}>
              <option value="">-- No Change --</option>
              {locations.map(l => (
                <option key={l.name} value={l.name}>{l.name} ({l.cost} Cost)</option>
              ))}
            </select>
          </div>
          <div className="bulk-field">
            <label>Change Grade Level</label>
            <select value={bulkGrade} onChange={e => setBulkGrade(e.target.value as GradeLevel)}>
              <option value="">-- No Change --</option>
              {(['Associate', 'Senior Associate', 'VP', 'ED', 'MD'] as GradeLevel[]).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className="bulk-actions-row">
            <button className="bulk-btn outline" onClick={() => setShowPanel(false)}>Cancel</button>
            <button className="bulk-btn primary" onClick={handleApply}>Apply Changes</button>
          </div>
        </div>
      )}
    </div>
  );
}
