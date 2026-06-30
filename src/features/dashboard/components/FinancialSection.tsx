import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell,
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

const FinancialSection = ({ analytics, loading }: Props) => (
  <div>
    <div className="flex items-center gap-2 mb-3 mt-6">
      <div className="w-1 h-5 rounded-full" style={{ background: '#c62828' }} />
      <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Financial Analytics</span>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

      {/* 1. Production Cost vs Sold Price */}
      <ChartCard title="Production Cost vs Sold Price" subtitle="Avg production cost & actual sold price per kg (₹)" loading={loading} empty={analytics.costTrend.length === 0} accentColor="#c62828">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analytics.costTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} width={56} />
            <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [
              `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/kg`,
              name === 'value3' ? 'Sold Price (Actual)' : 'Production Cost',
            ]} />
            <Legend wrapperStyle={{ fontSize: '0.68rem', fontWeight: 700 }}
              formatter={(v) => v === 'value3' ? 'Sold Price (Actual)' : 'Production Cost'} />
            <Line type="monotone" dataKey="value" stroke="#c62828" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="cost" />
            <Line type="monotone" dataKey="value3" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3, fill: '#7c3aed' }} activeDot={{ r: 5 }} name="value3" strokeDasharray="5 4" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Material Cost Distribution (Doughnut) */}
      <ChartCard title="Material Cost Distribution" subtitle="Cost contribution by material (₹)" loading={loading} empty={analytics.materialCostDistribution.length === 0} accentColor="#e65100">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={analytics.materialCostDistribution}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) => percent !== undefined && percent > 0.06 ? `${name}` : ''}
              labelLine={false}
            >
              {analytics.materialCostDistribution.map((entry, idx) => (
                <Cell key={idx} fill={entry.color || '#1565C0'} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [
              `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
              name,
            ]} />
            <Legend wrapperStyle={{ fontSize: '0.65rem', fontWeight: 600 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Production Cost Trend */}
      <ChartCard title="Production Cost Trend" subtitle="Cost per kg over time (₹/kg)" loading={loading} empty={analytics.costTrend.filter(p => p.value > 0).length === 0} accentColor="#b71c1c">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analytics.costTrend.filter(p => p.value > 0)} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} width={56} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`₹${Number(v).toFixed(2)}/kg`, 'Prod. Cost']} />
            <Line type="monotone" dataKey="value" stroke="#c62828" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#c62828' }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Expected Selling Price vs Sold Price */}
      <ChartCard title="Expected Selling Price vs Sold Price" subtitle="Expected vs actual selling price per kg (₹/kg)" loading={loading} empty={analytics.costTrend.filter(p => (p.value2 ?? 0) > 0 || (p.value3 ?? 0) > 0).length === 0} accentColor="#2e7d32">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={analytics.costTrend.filter(p => (p.value2 ?? 0) > 0 || (p.value3 ?? 0) > 0)} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} width={56} />
            <Tooltip {...tooltipStyle} formatter={(v: any, name: any) => [
              `₹${Number(v).toFixed(2)}/kg`,
              name === 'value3' ? 'Sold Price (Actual)' : 'Expected Selling Price',
            ]} />
            <Legend wrapperStyle={{ fontSize: '0.68rem', fontWeight: 700 }}
              formatter={(v) => v === 'value3' ? 'Sold Price (Actual)' : 'Expected Selling Price'} />
            <Line type="monotone" dataKey="value2" stroke="#2e7d32" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} name="value2" strokeDasharray="5 4" />
            <Line type="monotone" dataKey="value3" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 3, fill: '#7c3aed' }} activeDot={{ r: 5 }} name="value3" connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  </div>
);

export default FinancialSection;
