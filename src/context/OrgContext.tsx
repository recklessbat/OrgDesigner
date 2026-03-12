import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { Employee, OrgNode, Scenario, ChangeRecord, VisualizationConfig, FilterConfig } from '../types';
import { generateMockData } from '../data/mockData';
import { buildOrgTree } from '../utils/orgUtils';
import { v4 as uuidv4 } from 'uuid';

interface OrgContextType {
  // Data
  employees: Employee[];
  baselineEmployees: Employee[];
  orgTree: OrgNode[];
  scenarios: Scenario[];
  currentScenario: Scenario | null;
  changes: ChangeRecord[];

  // Config
  vizConfig: VisualizationConfig;
  filterConfig: FilterConfig;

  // Selection
  selectedNodes: Set<string>;
  draggedNodeId: string | null;

  // Actions
  setVizConfig: (config: VisualizationConfig) => void;
  setFilterConfig: (config: FilterConfig) => void;
  moveNode: (nodeId: string, newManagerId: string) => void;
  moveNodes: (nodeIds: string[], newManagerId: string) => void;
  addNode: (managerId: string) => void;
  flagForRemoval: (nodeId: string) => void;
  unflagForRemoval: (nodeId: string) => void;
  modifyNode: (nodeId: string, changes: Partial<Employee>) => void;
  modifyNodes: (nodeIds: string[], changes: Partial<Employee>) => void;
  toggleSelectNode: (nodeId: string) => void;
  selectSubtree: (nodeId: string) => void;
  clearSelection: () => void;
  setDraggedNodeId: (id: string | null) => void;
  toggleCollapse: (nodeId: string) => void;

  // Scenarios
  saveScenario: (name: string, description: string) => void;
  loadScenario: (scenarioId: string) => void;
  updateScenario: (scenarioId: string) => void;
  deleteScenario: (scenarioId: string) => void;
  resetToBaseline: () => void;

  // Sidebar state
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const baselineRef = useRef<Employee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [changes, setChanges] = useState<ChangeRecord[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const [vizConfig, setVizConfig] = useState<VisualizationConfig>({
    showGradeLevel: true,
    showLocationCost: true,
    showJobFunction: true,
    showAiImpact: false,
    showPerformance: false,
    showManagerQuality: false,
    showStovepipes: true,
    showLowSpan: true,
    showExceptions: true,
    colorBy: 'grade',
  });

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    searchQuery: '',
    includeContractors: true,
    gradeLevels: [],
    locationCostTypes: [],
    jobFunctions: [],
    jobFamilies: [],
    exceptionsOnly: false,
  });

  useEffect(() => {
    const data = generateMockData();
    baselineRef.current = JSON.parse(JSON.stringify(data));
    setEmployees(data);

    const baselineScenario: Scenario = {
      id: uuidv4(),
      name: 'Baseline',
      description: 'Current organizational structure',
      createdAt: new Date(),
      updatedAt: new Date(),
      employees: JSON.parse(JSON.stringify(data)),
      changes: [],
      isBaseline: true,
    };
    setScenarios([baselineScenario]);
  }, []);

  const addChange = useCallback((change: Omit<ChangeRecord, 'id' | 'timestamp'>) => {
    const record: ChangeRecord = {
      ...change,
      id: uuidv4(),
      timestamp: new Date(),
    };
    setChanges(prev => [record, ...prev]);
  }, []);

  // Build filtered org tree
  const orgTree = React.useMemo(() => {
    let filtered = employees;

    if (!filterConfig.includeContractors) {
      filtered = filtered.filter(e => e.employeeType !== 'Contractor');
    }
    if (filterConfig.gradeLevels.length > 0) {
      // Keep managers in the path even if not in filter
      const matchingIds = new Set(
        filtered.filter(e => filterConfig.gradeLevels.includes(e.gradeLevel)).map(e => e.id)
      );
      // Also include ancestors of matching nodes
      const ancestorIds = new Set<string>();
      for (const emp of filtered) {
        if (matchingIds.has(emp.id)) {
          let current = emp;
          while (current.managerId) {
            ancestorIds.add(current.managerId);
            const parent = filtered.find(e => e.id === current.managerId);
            if (!parent) break;
            current = parent;
          }
        }
      }
      filtered = filtered.filter(e => matchingIds.has(e.id) || ancestorIds.has(e.id));
    }

    if (filterConfig.jobFunctions.length > 0) {
      filtered = filtered.filter(e => filterConfig.jobFunctions.includes(e.jobFunction) || e.managerId === null);
    }

    const tree = buildOrgTree(filtered);

    // Apply collapsed state
    function applyCollapsed(nodes: OrgNode[]): OrgNode[] {
      return nodes.map(n => ({
        ...n,
        isCollapsed: collapsedNodes.has(n.id),
        isSelected: selectedNodes.has(n.id),
        children: applyCollapsed(n.children),
      }));
    }

    return applyCollapsed(tree);
  }, [employees, filterConfig, collapsedNodes, selectedNodes]);

  const moveNode = useCallback((nodeId: string, newManagerId: string) => {
    setEmployees(prev => {
      const emp = prev.find(e => e.id === nodeId);
      if (!emp) return prev;
      const oldManagerId = emp.managerId;
      const oldManager = prev.find(e => e.id === oldManagerId);
      const newManager = prev.find(e => e.id === newManagerId);
      addChange({
        type: 'move',
        description: `Moved ${emp.name} from ${oldManager?.name || 'root'} to ${newManager?.name || 'root'}`,
        nodeIds: [nodeId],
        previousState: { managerId: oldManagerId },
        newState: { managerId: newManagerId },
      });
      return prev.map(e => e.id === nodeId ? { ...e, managerId: newManagerId, status: 'modified' as const } : e);
    });
    // Auto-expand the new parent so the moved node is immediately visible
    setCollapsedNodes(prev => {
      if (prev.has(newManagerId)) {
        const next = new Set(prev);
        next.delete(newManagerId);
        return next;
      }
      return prev;
    });
  }, [addChange]);

  const moveNodes = useCallback((nodeIds: string[], newManagerId: string) => {
    setEmployees(prev => {
      const newManager = prev.find(e => e.id === newManagerId);
      addChange({
        type: 'move',
        description: `Moved ${nodeIds.length} employees to ${newManager?.name || 'root'}`,
        nodeIds,
      });
      return prev.map(e => nodeIds.includes(e.id) ? { ...e, managerId: newManagerId, status: 'modified' as const } : e);
    });
    // Auto-expand the new parent
    setCollapsedNodes(prev => {
      if (prev.has(newManagerId)) {
        const next = new Set(prev);
        next.delete(newManagerId);
        return next;
      }
      return prev;
    });
  }, [addChange]);

  const addNode = useCallback((managerId: string) => {
    const newId = `NEW-${uuidv4().slice(0, 8).toUpperCase()}`;
    const manager = employees.find(e => e.id === managerId);
    const newEmp: Employee = {
      id: newId,
      name: 'Open Position',
      title: 'TBD',
      gradeLevel: 'Associate',
      location: manager?.location || 'New York, NY',
      locationCostType: manager?.locationCostType || 'High',
      employeeType: 'FTE',
      jobFunction: manager?.jobFunction || 'Technology',
      jobFamily: manager?.jobFamily || 'General',
      managerId,
      performanceRating: 3,
      managerQualityScore: 3,
      aiImpactScore: 30,
      status: 'new_position',
      isOpenPosition: true,
    };
    addChange({
      type: 'add',
      description: `Added open position under ${manager?.name || 'root'}`,
      nodeIds: [newId],
    });
    setEmployees(prev => [...prev, newEmp]);
    // Auto-expand the parent so the new position is visible
    setCollapsedNodes(prev => {
      if (prev.has(managerId)) {
        const next = new Set(prev);
        next.delete(managerId);
        return next;
      }
      return prev;
    });
  }, [employees, addChange]);

  const flagForRemoval = useCallback((nodeId: string) => {
    setEmployees(prev => {
      const emp = prev.find(e => e.id === nodeId);
      addChange({
        type: 'remove',
        description: `Flagged ${emp?.name || nodeId} for removal`,
        nodeIds: [nodeId],
        previousState: { status: emp?.status },
        newState: { status: 'flagged_removal' },
      });
      return prev.map(e => e.id === nodeId ? { ...e, status: 'flagged_removal' as const } : e);
    });
  }, [addChange]);

  const unflagForRemoval = useCallback((nodeId: string) => {
    setEmployees(prev => {
      const emp = prev.find(e => e.id === nodeId);
      addChange({
        type: 'modify',
        description: `Unflagged ${emp?.name || nodeId} for removal`,
        nodeIds: [nodeId],
      });
      return prev.map(e => e.id === nodeId ? { ...e, status: 'active' as const } : e);
    });
  }, [addChange]);

  const modifyNode = useCallback((nodeId: string, nodeChanges: Partial<Employee>) => {
    setEmployees(prev => {
      const emp = prev.find(e => e.id === nodeId);
      addChange({
        type: 'modify',
        description: `Modified ${emp?.name || nodeId}: ${Object.keys(nodeChanges).join(', ')}`,
        nodeIds: [nodeId],
        previousState: emp ? Object.fromEntries(Object.keys(nodeChanges).map(k => [k, (emp as unknown as Record<string, unknown>)[k]])) as Partial<Employee> : undefined,
        newState: nodeChanges,
      });
      return prev.map(e => e.id === nodeId ? { ...e, ...nodeChanges, status: 'modified' as const } : e);
    });
  }, [addChange]);

  const modifyNodes = useCallback((nodeIds: string[], nodeChanges: Partial<Employee>) => {
    setEmployees(prev => {
      addChange({
        type: 'multi_modify',
        description: `Modified ${nodeIds.length} employees: ${Object.keys(nodeChanges).join(', ')}`,
        nodeIds,
        newState: nodeChanges,
      });
      return prev.map(e => nodeIds.includes(e.id) ? { ...e, ...nodeChanges, status: 'modified' as const } : e);
    });
    setSelectedNodes(new Set());
  }, [addChange]);

  const toggleSelectNode = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const selectSubtree = useCallback((nodeId: string) => {
    function findNode(nodes: OrgNode[]): OrgNode | undefined {
      for (const n of nodes) {
        if (n.id === nodeId) return n;
        const found = findNode(n.children);
        if (found) return found;
      }
      return undefined;
    }
    const node = findNode(orgTree);
    if (node) {
      const ids: string[] = [];
      function collect(n: OrgNode) {
        ids.push(n.id);
        n.children.forEach(collect);
      }
      collect(node);
      setSelectedNodes(prev => {
        const next = new Set(prev);
        // If all are already selected, deselect all
        const allSelected = ids.every(id => next.has(id));
        if (allSelected) {
          ids.forEach(id => next.delete(id));
        } else {
          ids.forEach(id => next.add(id));
        }
        return next;
      });
    }
  }, [orgTree]);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const toggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const saveScenario = useCallback((name: string, description: string) => {
    const scenario: Scenario = {
      id: uuidv4(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      employees: JSON.parse(JSON.stringify(employees)),
      changes: [...changes],
    };
    setScenarios(prev => [...prev, scenario]);
    setCurrentScenario(scenario);
  }, [employees, changes]);

  const loadScenario = useCallback((scenarioId: string) => {
    const scenario = scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      setEmployees(JSON.parse(JSON.stringify(scenario.employees)));
      setChanges(scenario.isBaseline ? [] : [...scenario.changes]);
      setCurrentScenario(scenario);
      setSelectedNodes(new Set());
      setCollapsedNodes(new Set());
    }
  }, [scenarios]);

  const updateScenario = useCallback((scenarioId: string) => {
    setScenarios(prev => prev.map(s =>
      s.id === scenarioId
        ? { ...s, employees: JSON.parse(JSON.stringify(employees)), changes: [...changes], updatedAt: new Date() }
        : s
    ));
  }, [employees, changes]);

  const deleteScenario = useCallback((scenarioId: string) => {
    setScenarios(prev => prev.filter(s => s.id !== scenarioId));
    if (currentScenario?.id === scenarioId) {
      setCurrentScenario(null);
    }
  }, [currentScenario]);

  const resetToBaseline = useCallback(() => {
    setEmployees(JSON.parse(JSON.stringify(baselineRef.current)));
    setChanges([]);
    setCurrentScenario(null);
    setSelectedNodes(new Set());
    setCollapsedNodes(new Set());
  }, []);

  return (
    <OrgContext.Provider value={{
      employees,
      baselineEmployees: baselineRef.current,
      orgTree,
      scenarios,
      currentScenario,
      changes,
      vizConfig,
      filterConfig,
      selectedNodes,
      draggedNodeId,
      setVizConfig,
      setFilterConfig,
      moveNode,
      moveNodes,
      addNode,
      flagForRemoval,
      unflagForRemoval,
      modifyNode,
      modifyNodes,
      toggleSelectNode,
      selectSubtree,
      clearSelection,
      setDraggedNodeId,
      toggleCollapse,
      saveScenario,
      loadScenario,
      updateScenario,
      deleteScenario,
      resetToBaseline,
      leftSidebarOpen,
      rightSidebarOpen,
      setLeftSidebarOpen,
      setRightSidebarOpen,
    }}>
      {children}
    </OrgContext.Provider>
  );
}
