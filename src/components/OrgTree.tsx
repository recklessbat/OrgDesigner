import { useRef, useState, useCallback } from 'react';
import type { OrgNode as OrgNodeType } from '../types';
import { OrgNodeCard } from './OrgNode';
import { useOrg } from '../context/OrgContext';

function OrgTreeBranch({ node, isRoot }: { node: OrgNodeType; isRoot?: boolean }) {
  const { filterConfig } = useOrg();
  const visibleChildren = node.isCollapsed ? [] : node.children;

  // Search highlighting
  const searchMatch = filterConfig.searchQuery
    ? node.name.toLowerCase().includes(filterConfig.searchQuery.toLowerCase()) ||
      node.title.toLowerCase().includes(filterConfig.searchQuery.toLowerCase()) ||
      node.id.toLowerCase().includes(filterConfig.searchQuery.toLowerCase())
    : false;

  return (
    <div className={`tree-branch ${isRoot ? 'root' : ''} ${searchMatch && filterConfig.searchQuery ? 'search-match' : ''}`}>
      <OrgNodeCard node={node} />
      {visibleChildren.length > 0 && (
        <div className="tree-children">
          <div className="tree-connector-vertical" />
          {visibleChildren.map(child => (
            <div key={child.id} className="tree-child-wrapper">
              <div className="tree-connector-horizontal" />
              <OrgTreeBranch node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgTree() {
  const { orgTree, clearSelection } = useOrg();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(0.75);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(prev => Math.max(0.2, Math.min(2, prev + delta)));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: panStart.current.panX + (e.clientX - panStart.current.x),
        y: panStart.current.panY + (e.clientY - panStart.current.y),
      });
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('tree-canvas')) {
      clearSelection();
    }
  }, [clearSelection]);

  return (
    <div className="org-tree-container" ref={containerRef}>
      <div className="zoom-controls">
        <button onClick={() => setZoom(prev => Math.min(2, prev + 0.1))} title="Zoom in">+</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(prev => Math.max(0.2, prev - 0.1))} title="Zoom out">−</button>
        <button onClick={() => { setZoom(0.75); setPan({ x: 40, y: 40 }); }} title="Reset view">⟲</button>
      </div>

      <div
        className="tree-viewport"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBackgroundClick}
        style={{ cursor: isPanning ? 'grabbing' : 'default' }}
      >
        <div
          className="tree-canvas"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {orgTree.map(rootNode => (
            <OrgTreeBranch key={rootNode.id} node={rootNode} isRoot />
          ))}
          {orgTree.length === 0 && (
            <div className="empty-tree">
              <p>No organizational data to display.</p>
              <p>Try adjusting your filters or loading a scenario.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
