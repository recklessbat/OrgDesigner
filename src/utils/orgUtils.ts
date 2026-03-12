import type { Employee, OrgNode, Exception, MetricsDelta } from '../types';

export function buildOrgTree(employees: Employee[], rootId?: string | null): OrgNode[] {
  const employeeMap = new Map<string, Employee>();
  const childrenMap = new Map<string | null, Employee[]>();

  for (const emp of employees) {
    employeeMap.set(emp.id, emp);
    const children = childrenMap.get(emp.managerId) || [];
    children.push(emp);
    childrenMap.set(emp.managerId, children);
  }

  function buildNode(emp: Employee, depth: number): OrgNode {
    const children = (childrenMap.get(emp.id) || [])
      .map(child => buildNode(child, depth + 1))
      .sort((a, b) => {
        const gradeOrder = ['MD', 'ED', 'VP', 'Senior Associate', 'Associate'];
        return gradeOrder.indexOf(a.gradeLevel) - gradeOrder.indexOf(b.gradeLevel);
      });

    return {
      ...emp,
      children,
      depth,
      isCollapsed: depth > 1,
      isSelected: false,
    };
  }

  const roots = childrenMap.get(rootId ?? null) || [];
  return roots.map(r => buildNode(r, 0));
}

export function flattenTree(nodes: OrgNode[]): OrgNode[] {
  const result: OrgNode[] = [];
  function walk(node: OrgNode) {
    result.push(node);
    for (const child of node.children) {
      walk(child);
    }
  }
  for (const n of nodes) walk(n);
  return result;
}

export function getDescendantIds(node: OrgNode): string[] {
  const ids: string[] = [];
  function walk(n: OrgNode) {
    ids.push(n.id);
    for (const child of n.children) walk(child);
  }
  walk(node);
  return ids;
}

export function detectExceptions(node: OrgNode, employees: Employee[]): Exception[] {
  const exceptions: Exception[] = [];
  const childrenMap = new Map<string, Employee[]>();
  for (const emp of employees) {
    if (emp.managerId) {
      const children = childrenMap.get(emp.managerId) || [];
      children.push(emp);
      childrenMap.set(emp.managerId, children);
    }
  }

  // Stovepipe: same grade level as manager chain
  const manager = employees.find(e => e.id === node.managerId);
  if (manager && manager.gradeLevel === node.gradeLevel && ['ED', 'VP', 'MD'].includes(node.gradeLevel)) {
    exceptions.push({
      type: 'stovepipe',
      label: 'Stovepipe',
      color: '#F59E0B',
      description: `${node.gradeLevel} reporting to ${manager.gradeLevel}`,
    });
  }

  // Low performer
  if (node.performanceRating <= 2) {
    exceptions.push({
      type: 'low_performer',
      label: 'Low Performer',
      color: '#EF4444',
      description: `Performance rating: ${node.performanceRating}/5`,
    });
  }

  // Low quality manager
  const directReports = childrenMap.get(node.id) || [];
  if (directReports.length > 0 && node.managerQualityScore <= 2) {
    exceptions.push({
      type: 'low_quality_manager',
      label: 'Low Quality Mgr',
      color: '#F97316',
      description: `Manager quality: ${node.managerQualityScore}/5`,
    });
  }

  // Low span of control
  if (directReports.length >= 1 && directReports.length <= 2 && ['VP', 'ED', 'MD'].includes(node.gradeLevel)) {
    exceptions.push({
      type: 'low_span',
      label: 'Low Span',
      color: '#8B5CF6',
      description: `Only ${directReports.length} direct report(s)`,
    });
  }

  // High AI impact
  if (node.aiImpactScore >= 70) {
    exceptions.push({
      type: 'high_ai_impact',
      label: 'AI Impacted',
      color: '#06B6D4',
      description: `AI automation likelihood: ${node.aiImpactScore}%`,
    });
  }

  return exceptions;
}

export function calculateMetric(current: number, baseline: number): MetricsDelta {
  const delta = current - baseline;
  const deltaPercent = baseline === 0 ? 0 : (delta / baseline) * 100;
  return { current, baseline, delta, deltaPercent };
}

export function computeOrgMetrics(employees: Employee[]) {
  const activeEmployees = employees.filter(e => e.status !== 'flagged_removal');
  const total = activeEmployees.length;

  // Layers
  const childrenMap = new Map<string | null, Employee[]>();
  for (const emp of activeEmployees) {
    const children = childrenMap.get(emp.managerId) || [];
    children.push(emp);
    childrenMap.set(emp.managerId, children);
  }

  function maxDepth(empId: string, depth: number): number {
    const children = childrenMap.get(empId) || [];
    if (children.length === 0) return depth;
    return Math.max(...children.map(c => maxDepth(c.id, depth + 1)));
  }
  const roots = childrenMap.get(null) || [];
  const layers = roots.length > 0 ? Math.max(...roots.map(r => maxDepth(r.id, 1))) : 0;

  // Managers and span
  const managers = activeEmployees.filter(e => (childrenMap.get(e.id) || []).length > 0);
  const totalSpan = managers.reduce((sum, m) => sum + (childrenMap.get(m.id) || []).length, 0);
  const avgSpan = managers.length > 0 ? totalSpan / managers.length : 0;

  // Low span managers
  const lowSpanManagers = managers.filter(m => {
    const reports = (childrenMap.get(m.id) || []).length;
    return reports >= 1 && reports <= 2;
  }).length;

  // Location cost
  const lowCostCount = activeEmployees.filter(e => e.locationCostType === 'Low').length;
  const lowCostPct = total > 0 ? (lowCostCount / total) * 100 : 0;

  // Grade distribution
  const seniorGrades = activeEmployees.filter(e => ['VP', 'ED', 'MD'].includes(e.gradeLevel)).length;
  const seniorPct = total > 0 ? (seniorGrades / total) * 100 : 0;

  // Contractor percentage
  const contractors = activeEmployees.filter(e => e.employeeType === 'Contractor').length;
  const contractorPct = total > 0 ? (contractors / total) * 100 : 0;

  // AI impact
  const highAiImpact = activeEmployees.filter(e => e.aiImpactScore >= 70).length;
  const highAiPct = total > 0 ? (highAiImpact / total) * 100 : 0;

  // Job function distribution
  const jfDist: Record<string, number> = {};
  for (const e of activeEmployees) {
    jfDist[e.jobFunction] = (jfDist[e.jobFunction] || 0) + 1;
  }

  // Grade distribution
  const gradeDist: Record<string, number> = {};
  for (const e of activeEmployees) {
    gradeDist[e.gradeLevel] = (gradeDist[e.gradeLevel] || 0) + 1;
  }

  return {
    totalHeadcount: total,
    layers,
    avgSpanOfControl: Math.round(avgSpan * 10) / 10,
    lowSpanManagers,
    totalManagers: managers.length,
    lowCostPct: Math.round(lowCostPct * 10) / 10,
    seniorPct: Math.round(seniorPct * 10) / 10,
    contractorPct: Math.round(contractorPct * 10) / 10,
    highAiPct: Math.round(highAiPct * 10) / 10,
    jobFunctionDist: jfDist,
    gradeDist: gradeDist,
  };
}

export const GRADE_COLORS: Record<string, string> = {
  'MD': '#1E40AF',
  'ED': '#3B82F6',
  'VP': '#6366F1',
  'Senior Associate': '#8B5CF6',
  'Associate': '#A78BFA',
};

export const LOCATION_COST_COLORS: Record<string, string> = {
  'High': '#EF4444',
  'Mid': '#F59E0B',
  'Low': '#10B981',
};

export const STATUS_COLORS: Record<string, string> = {
  'active': '#E5E7EB',
  'flagged_removal': '#FEE2E2',
  'new_position': '#D1FAE5',
  'modified': '#FEF3C7',
};

export const AI_IMPACT_COLOR = (score: number): string => {
  if (score >= 70) return '#06B6D4';
  if (score >= 40) return '#F59E0B';
  return '#10B981';
};
