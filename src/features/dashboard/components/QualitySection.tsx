import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  PieChart, Pie, Legend,
} from 'recharts';
import ChartCard from './ChartCard';
import type { DashboardAnalytics } from '../types/dashboard.types';

interface Props {
  analytics: DashboardAnalytics;
  loading: boolean;
}

const axisStyle = { fontSize: '0.65rem', fill: '#94a3b8', fontWeight: 600 };
const tooltipStyle = {
  contentStyle: { fontSize: '0.72rem', borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  labelStyle: { fontWeight: 700, color: '#1e293b' },
};

const GREEN = '#2e7d32';
const RED = '#c62828';
const BLUE = '#1565C0';

const QualitySection = ({ analytics, loading }: Props) => (
  <div>
    <div className="flex items-center gap-2 mb-3 mt-6">
      <div className="w-1 h-5 rounded-full" style={{ background: GREEN }} />
      <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Quality &amp; Efficiency Analytics</span>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* 1. Efficiency Trend */}
      <ChartCard title="Efficiency Trend" subtitle="Average recovery efficiency per day (%)" loading={loading} empty={analytics.efficiencyTrend.length === 0} accentColor={GREEN}>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analytics.efficiencyTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} width={44} domain={[70, 100]} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, 'Efficiency']} />
            <Line type="monotone" dataKey="value" stroke={GREEN} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: GREEN }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Quality PASS/FAIL */}
      <ChartCard title="Quality Control Results" subtitle="PASS vs FAIL distribution" loading={loading} empty={analytics.qualityPassFail.every(q => q.value === 0)} accentColor={GREEN}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={analytics.qualityPassFail.filter(q => q.value > 0)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={3}
              label={({ name, value, percent }) => `${name}: ${value} (${percent !== undefined ? (percent * 100).toFixed(0) : 0}%)`}
              labelLine
            >
              {analytics.qualityPassFail.map((entry, idx) => (
                <Cell key={idx} fill={entry.color || BLUE} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [v, name]} />
            <Legend wrapperStyle={{ fontSize: '0.68rem', fontWeight: 700 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Shift Performance */}
      <ChartCard title="Shift Performance" subtitle="Average efficiency by shift" loading={loading} empty={analytics.shiftPerformance.every(s => s.value === 0)} accentColor={BLUE}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={analytics.shiftPerformance} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} width={44} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toFixed(2)}%`, 'Avg Efficiency']} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {analytics.shiftPerformance.map((entry, idx) => (
                <Cell key={idx} fill={entry.color || BLUE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Loss Analysis (Input → Production Loss → Finished → Dispatched) */}
      <ChartCard title="Loss Analysis" subtitle="Material flow: Input → Finished → Dispatched (kg)" loading={loading} empty={analytics.lossAnalysis.every(l => l.value === 0)} accentColor={RED}>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={analytics.lossAnalysis} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ ...axisStyle, fontSize: '0.62rem' }} axisLine={false} tickLine={false} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}T` : `${v}kg`} width={52} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toLocaleString('en-IN')} kg`, '']} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {analytics.lossAnalysis.map((entry, idx) => (
                <Cell key={idx} fill={entry.color || BLUE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  </div>
);

export default QualitySection;
