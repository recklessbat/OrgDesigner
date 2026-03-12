import { useOrg } from '../context/OrgContext';
import { computeOrgMetrics, GRADE_COLORS } from '../utils/orgUtils';

function MetricCard({ label, value, baseline, unit, inverse }: {
  label: string;
  value: number;
  baseline?: number;
  unit?: string;
  inverse?: boolean; // lower is better
}) {
  const hasBaseline = baseline !== undefined && baseline !== value;
  const delta = hasBaseline ? value - baseline : 0;
  const deltaPct = hasBaseline && baseline !== 0 ? ((delta / baseline) * 100) : 0;
  const isPositive = inverse ? delta < 0 : delta > 0;
  const isNegative = inverse ? delta > 0 : delta < 0;

  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {hasBaseline && (
        <div className={`metric-delta ${isPositive ? 'positive' : isNegative ? 'negative' : ''}`}>
          {delta > 0 ? '+' : ''}{Number.isInteger(delta) ? delta : delta.toFixed(1)}
          {' '}({deltaPct > 0 ? '+' : ''}{deltaPct.toFixed(1)}%)
        </div>
      )}
    </div>
  );
}

function DistributionBar({ items, colorMap }: { items: Record<string, number>; colorMap?: Record<string, string> }) {
  const total = Object.values(items).reduce((sum, v) => sum + v, 0);
  if (total === 0) return null;

  const sorted = Object.entries(items).sort((a, b) => b[1] - a[1]);
  const defaultColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="dist-bar-container">
      <div className="dist-bar">
        {sorted.map(([key, val], i) => (
          <div
            key={key}
            className="dist-bar-segment"
            style={{
              width: `${(val / total) * 100}%`,
              backgroundColor: colorMap?.[key] || defaultColors[i % defaultColors.length],
            }}
            title={`${key}: ${val} (${((val / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      <div className="dist-legend">
        {sorted.map(([key, val], i) => (
          <div key={key} className="dist-legend-item">
            <span className="dist-legend-dot" style={{ backgroundColor: colorMap?.[key] || defaultColors[i % defaultColors.length] }} />
            <span className="dist-legend-label">{key}</span>
            <span className="dist-legend-val">{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MetricsDashboard() {
  const { employees, baselineEmployees, rightSidebarOpen, setRightSidebarOpen } = useOrg();

  const currentMetrics = computeOrgMetrics(employees);
  const baselineMetrics = computeOrgMetrics(baselineEmployees);

  return (
    <>
      {/* Toggle button */}
      <button
        className={`sidebar-toggle right-toggle ${rightSidebarOpen ? 'open' : ''}`}
        onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
        title="Metrics Dashboard"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      </button>

      {/* Sidebar */}
      <div className={`sidebar right-sidebar ${rightSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>Org Metrics</h3>
          <span className="sidebar-subtitle">vs. Baseline</span>
        </div>

        <div className="sidebar-content">
          <div className="metrics-section">
            <div className="metrics-section-title">Headcount & Structure</div>
            <div className="metrics-grid">
              <MetricCard label="Total Headcount" value={currentMetrics.totalHeadcount} baseline={baselineMetrics.totalHeadcount} />
              <MetricCard label="Org Layers" value={currentMetrics.layers} baseline={baselineMetrics.layers} inverse />
              <MetricCard label="Avg Span of Control" value={currentMetrics.avgSpanOfControl} baseline={baselineMetrics.avgSpanOfControl} />
              <MetricCard label="Low-Span Managers" value={currentMetrics.lowSpanManagers} baseline={baselineMetrics.lowSpanManagers} inverse />
              <MetricCard label="Total Managers" value={currentMetrics.totalManagers} baseline={baselineMetrics.totalManagers} />
            </div>
          </div>

          <div className="metrics-section">
            <div className="metrics-section-title">Cost & Location</div>
            <div className="metrics-grid">
              <MetricCard label="Low-Cost Locations" value={currentMetrics.lowCostPct} baseline={baselineMetrics.lowCostPct} unit="%" />
              <MetricCard label="Contractors" value={currentMetrics.contractorPct} baseline={baselineMetrics.contractorPct} unit="%" />
            </div>
          </div>

          <div className="metrics-section">
            <div className="metrics-section-title">Seniority Mix</div>
            <div className="metrics-grid">
              <MetricCard label="VP+ %" value={currentMetrics.seniorPct} baseline={baselineMetrics.seniorPct} unit="%" inverse />
            </div>
            <DistributionBar items={currentMetrics.gradeDist} colorMap={GRADE_COLORS} />
          </div>

          <div className="metrics-section">
            <div className="metrics-section-title">AI Impact</div>
            <div className="metrics-grid">
              <MetricCard label="High AI Impact" value={currentMetrics.highAiPct} baseline={baselineMetrics.highAiPct} unit="%" />
            </div>
          </div>

          <div className="metrics-section">
            <div className="metrics-section-title">Job Function Distribution</div>
            <DistributionBar items={currentMetrics.jobFunctionDist} />
          </div>
        </div>
      </div>
    </>
  );
}
