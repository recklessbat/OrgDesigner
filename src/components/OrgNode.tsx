import { useCallback } from 'react';
import type { OrgNode as OrgNodeType } from '../types';
import { useOrg } from '../context/OrgContext';
import { detectExceptions, GRADE_COLORS, LOCATION_COST_COLORS, STATUS_COLORS, AI_IMPACT_COLOR } from '../utils/orgUtils';

interface OrgNodeCardProps {
  node: OrgNodeType;
}

const JOB_FUNCTION_COLORS: Record<string, string> = {
  'Technology': '#3B82F6',
  'Operations': '#10B981',
  'Risk Management': '#F59E0B',
  'Finance': '#8B5CF6',
  'Sales & Trading': '#EF4444',
  'Legal & Compliance': '#6366F1',
  'Human Resources': '#EC4899',
  'Executive': '#1F2937',
};

export function OrgNodeCard({ node }: OrgNodeCardProps) {
  const {
    vizConfig, employees, selectedNodes,
    toggleSelectNode, selectSubtree, toggleCollapse,
    moveNode, setDraggedNodeId, draggedNodeId,
    flagForRemoval, unflagForRemoval, addNode,
  } = useOrg();

  const exceptions = vizConfig.showExceptions ? detectExceptions(node, employees) : [];
  const directReports = node.children.length;
  const isSelected = selectedNodes.has(node.id);

  const getBorderColor = (): string => {
    if (node.status === 'flagged_removal') return '#EF4444';
    if (node.status === 'new_position') return '#10B981';
    if (node.status === 'modified') return '#F59E0B';
    switch (vizConfig.colorBy) {
      case 'grade': return GRADE_COLORS[node.gradeLevel] || '#9CA3AF';
      case 'locationCost': return LOCATION_COST_COLORS[node.locationCostType] || '#9CA3AF';
      case 'jobFunction': return JOB_FUNCTION_COLORS[node.jobFunction] || '#9CA3AF';
      case 'aiImpact': return AI_IMPACT_COLOR(node.aiImpactScore);
      case 'status': return node.status === 'active' ? '#9CA3AF' : STATUS_COLORS[node.status];
      default: return '#E5E7EB';
    }
  };

  const getBackgroundColor = (): string => {
    if (node.status === 'flagged_removal') return '#FEF2F2';
    if (node.status === 'new_position') return '#F0FDF4';
    if (node.status === 'modified') return '#FFFBEB';
    return '#FFFFFF';
  };

  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNodeId(node.id);
  }, [node.id, setDraggedNodeId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (draggedNodeId && draggedNodeId !== node.id) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      (e.currentTarget as HTMLElement).classList.add('drag-over');
    }
  }, [draggedNodeId, node.id]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drag-over');
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== node.id) {
      moveNode(sourceId, node.id);
    }
    setDraggedNodeId(null);
  }, [node.id, moveNode, setDraggedNodeId]);

  const handleDragEnd = useCallback(() => {
    setDraggedNodeId(null);
  }, [setDraggedNodeId]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectSubtree(node.id);
  }, [node.id, selectSubtree]);

  const borderColor = getBorderColor();

  return (
    <div className="org-node-wrapper">
      <div
        className={`org-node-card ${isSelected ? 'selected' : ''} ${node.status === 'flagged_removal' ? 'flagged' : ''} ${node.isOpenPosition ? 'open-position' : ''}`}
        style={{
          borderLeftColor: borderColor,
          backgroundColor: getBackgroundColor(),
        }}
        draggable
        onMouseDown={e => e.stopPropagation()}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onDoubleClick={handleDoubleClick}
      >
        {/* Checkbox - top right */}
        <div className="node-checkbox" onClick={e => { e.stopPropagation(); toggleSelectNode(node.id); }}>
          <input type="checkbox" checked={isSelected} readOnly />
        </div>

        {/* Status indicators */}
        {node.status === 'flagged_removal' && <div className="status-stripe removal" />}
        {node.status === 'new_position' && <div className="status-stripe new-pos" />}
        {node.status === 'modified' && <div className="status-stripe modified" />}

        {/* Main content */}
        <div className="node-header">
          <div className="node-name" title={node.name}>{node.name}</div>
          <div className="node-title" title={node.title}>{node.title}</div>
        </div>

        {/* Metadata row */}
        <div className="node-meta">
          {vizConfig.showGradeLevel && (
            <span className="meta-badge grade" style={{ backgroundColor: GRADE_COLORS[node.gradeLevel] + '20', color: GRADE_COLORS[node.gradeLevel] }}>
              {node.gradeLevel}
            </span>
          )}
          {vizConfig.showLocationCost && (
            <span className="meta-badge location" style={{ backgroundColor: LOCATION_COST_COLORS[node.locationCostType] + '20', color: LOCATION_COST_COLORS[node.locationCostType] }}>
              {node.locationCostType}
            </span>
          )}
          {vizConfig.showJobFunction && (
            <span className="meta-badge job-func" title={`${node.jobFunction} / ${node.jobFamily}`}>
              {node.jobFamily.length > 16 ? node.jobFamily.slice(0, 14) + '...' : node.jobFamily}
            </span>
          )}
        </div>

        {/* Additional metadata */}
        <div className="node-meta-secondary">
          <span className="meta-location" title={node.location}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {node.location}
          </span>
          {node.employeeType === 'Contractor' && (
            <span className="meta-badge contractor">CTR</span>
          )}
        </div>

        {/* AI Impact indicator */}
        {vizConfig.showAiImpact && node.aiImpactScore >= 50 && (
          <div className="ai-impact-bar">
            <div className="ai-impact-label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={AI_IMPACT_COLOR(node.aiImpactScore)} strokeWidth="2">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93L12 22l-.75-12.07A4.001 4.001 0 0 1 12 2z" />
              </svg>
              AI {node.aiImpactScore}%
            </div>
            <div className="ai-bar-track">
              <div className="ai-bar-fill" style={{ width: `${node.aiImpactScore}%`, backgroundColor: AI_IMPACT_COLOR(node.aiImpactScore) }} />
            </div>
          </div>
        )}

        {/* Performance / Manager Quality */}
        {(vizConfig.showPerformance || vizConfig.showManagerQuality) && (
          <div className="node-ratings">
            {vizConfig.showPerformance && (
              <span className={`rating ${node.performanceRating <= 2 ? 'low' : ''}`} title="Performance Rating">
                P:{node.performanceRating}/5
              </span>
            )}
            {vizConfig.showManagerQuality && directReports > 0 && (
              <span className={`rating ${node.managerQualityScore <= 2 ? 'low' : ''}`} title="Manager Quality">
                M:{node.managerQualityScore}/5
              </span>
            )}
          </div>
        )}

        {/* Exception badges */}
        {exceptions.length > 0 && (
          <div className="node-exceptions">
            {exceptions.map((exc, i) => (
              <span
                key={i}
                className="exception-badge"
                style={{ backgroundColor: exc.color + '20', color: exc.color, borderColor: exc.color + '40' }}
                title={exc.description}
              >
                <span className="exception-dot" style={{ backgroundColor: exc.color }} />
                {exc.label}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="node-actions">
          {node.children.length > 0 && (
            <button
              className="node-action-btn"
              onClick={e => { e.stopPropagation(); toggleCollapse(node.id); }}
              title={node.isCollapsed ? 'Expand' : 'Collapse'}
            >
              {node.isCollapsed ? `▶ ${node.children.length}` : '▼'}
            </button>
          )}
          <button
            className="node-action-btn add"
            onClick={e => { e.stopPropagation(); addNode(node.id); }}
            title="Add position"
          >
            +
          </button>
          {node.status !== 'flagged_removal' ? (
            <button
              className="node-action-btn remove"
              onClick={e => { e.stopPropagation(); flagForRemoval(node.id); }}
              title="Flag for removal"
            >
              &times;
            </button>
          ) : (
            <button
              className="node-action-btn restore"
              onClick={e => { e.stopPropagation(); unflagForRemoval(node.id); }}
              title="Unflag"
            >
              ↩
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
