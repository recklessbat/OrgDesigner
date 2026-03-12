export type GradeLevel = 'Associate' | 'Senior Associate' | 'VP' | 'ED' | 'MD';

export type LocationCostType = 'High' | 'Mid' | 'Low';

export type EmployeeType = 'FTE' | 'Contractor';

export type NodeStatus = 'active' | 'flagged_removal' | 'new_position' | 'modified';

export interface Employee {
  id: string;
  name: string;
  title: string;
  gradeLevel: GradeLevel;
  location: string;
  locationCostType: LocationCostType;
  employeeType: EmployeeType;
  jobFunction: string;
  jobFamily: string;
  managerId: string | null;
  performanceRating: number; // 1-5
  managerQualityScore: number; // 1-5
  aiImpactScore: number; // 0-100, likelihood of AI automation
  status: NodeStatus;
  isOpenPosition?: boolean;
}

export interface OrgNode extends Employee {
  children: OrgNode[];
  depth: number;
  isCollapsed?: boolean;
  isSelected?: boolean;
}

export type ExceptionType =
  | 'stovepipe'
  | 'low_performer'
  | 'low_quality_manager'
  | 'low_span'
  | 'high_ai_impact'
  | 'grade_skip';

export interface Exception {
  type: ExceptionType;
  label: string;
  color: string;
  description: string;
}

export interface ChangeRecord {
  id: string;
  timestamp: Date;
  type: 'move' | 'add' | 'remove' | 'modify' | 'multi_modify';
  description: string;
  nodeIds: string[];
  previousState?: Partial<Employee>;
  newState?: Partial<Employee>;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  employees: Employee[];
  changes: ChangeRecord[];
  isBaseline?: boolean;
}

export interface VisualizationConfig {
  showGradeLevel: boolean;
  showLocationCost: boolean;
  showJobFunction: boolean;
  showAiImpact: boolean;
  showPerformance: boolean;
  showManagerQuality: boolean;
  showStovepipes: boolean;
  showLowSpan: boolean;
  showExceptions: boolean;
  colorBy: 'grade' | 'locationCost' | 'jobFunction' | 'aiImpact' | 'status' | 'none';
}

export interface FilterConfig {
  searchQuery: string;
  includeContractors: boolean;
  gradeLevels: GradeLevel[];
  locationCostTypes: LocationCostType[];
  jobFunctions: string[];
  jobFamilies: string[];
  exceptionsOnly: boolean;
}

export interface MetricsDelta {
  current: number;
  baseline: number;
  delta: number;
  deltaPercent: number;
}
