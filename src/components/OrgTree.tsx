import { useRef, useState, useCallback, useLayoutEffect } from 'react';
import type { OrgNode as OrgNodeType } from '../types';
import { OrgNodeCard } from './OrgNode';
import { useOrg } from '../context/OrgContext';

function OrgTreeBranch({ node, isRoot }: { node: OrgNodeType; isRoot?: boolean }) {
  const { filterConfig } = useOrg();
  const visibleChildren = node.isCollapsed ? [] : node.children;
  const childrenRef = useRef<HTMLDivElement>(null);
  const [railStyle, setRailStyle] = useState<React.CSSProperties>({});

  // Measure child positions and set horizontal rail to span exactly
  // from the center of the first child to the center of the last child
  useLayoutEffect(() => {
    if (!childrenRef.current || visibleChildren.length < 2) {
      setRailStyle({});
      return;
    }
    const container = childrenRef.current;
    const wrappers = container.querySelectorAll<HTMLElement>(':scope > .tree-child-wrapper');
    if (wrappers.length < 2) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const firstRect = wrappers[0].getBoundingClientRect();
      const lastRect = wrappers[wrappers.length - 1].getBoundingClientRect();
      const left = firstRect.left + firstRect.width / 2 - containerRect.left;
      const right = containerRect.right - (lastRect.left + lastRect.width / 2);
      setRailStyle({ left: `${left}px`, right: `${right}px` });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [visibleChildren.length, visibleChildren.map(c => c.id).join(',')]);

  // Search highlighting
  const searchMatch = filterConfig.searchQuery
    ? node.name.toLowerCase().includes(filterConfig.searchQuery.toLowerCase()) ||
      node.title.toLowerCase().includes(filterConfig.searchQuery.toLowerCase()) ||
      node.id.toLowerCase().includes(filterConfig.searchQuery.toLowerCase())
    : false;

  const hasMultipleChildren = visibleChildren.length > 1;

  return (
    <div className={`tree-branch ${isRoot ? 'root' : ''} ${searchMatch && filterConfig.searchQuery ? 'search-match' : ''}`}>
      <OrgNodeCard node={node} />
      {visibleChildren.length > 0 && (
        <div className="tree-children" ref={childrenRef}>
          {hasMultipleChildren && (
            <div className="tree-connector-rail" style={railStyle} />
          )}
          {visibleChildren.map(child => (
            <div key={child.id} className="tree-child-wrapper">
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
  const didPan = useRef(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom(prev => Math.max(0.2, Math.min(2, prev + delta)));
    } else {
      // Scroll / trackpad to pan
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning when clicking on the background, not on node cards
    const target = e.target as HTMLElement;
    const isOnNode = target.closest('.org-node-card');
    if (isOnNode) return; // Let node handle its own drag

    if (e.button === 0 || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      didPan.current = false;
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        didPan.current = true;
      }
      setPan({
        x: panStart.current.panX + dx,
        y: panStart.current.panY + dy,
      });
    }
  }, [isPanning]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Only clear selection if user clicked without dragging
    if (!didPan.current && (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('tree-canvas'))) {
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
        className={`tree-viewport ${isPanning && didPan.current ? 'is-panning' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
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
