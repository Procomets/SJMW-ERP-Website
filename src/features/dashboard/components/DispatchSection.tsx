import { Box } from '@mui/material';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
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

const BLUE = '#0277bd';

const DispatchSection = ({ analytics, loading }: Props) => (
  <div>
    <div className="flex items-center gap-2 mb-3 mt-6">
      <div className="w-1 h-5 rounded-full" style={{ background: BLUE }} />
      <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Dispatch Analytics</span>
    </div>

    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>

      {/* 1. Dispatch Trend */}
      <ChartCard title="Dispatch Trend" subtitle="Total dispatched weight per day (kg)" loading={loading} empty={analytics.dispatchTrend.length === 0} accentColor={BLUE}>
        <ResponsiveContainer width="100%" height={260} minWidth={440} minHeight={260}>
          <AreaChart data={analytics.dispatchTrend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="dispGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BLUE} stopOpacity={0.18} />
                <stop offset="95%" stopColor={BLUE} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}kg`} width={52} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toLocaleString('en-IN')} kg`, 'Dispatched']} />
            <Area type="monotone" dataKey="value" stroke={BLUE} strokeWidth={2.5} fill="url(#dispGrad)" dot={false} activeDot={{ r: 4, fill: BLUE }} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. Customer-wise Dispatch */}
      <ChartCard title="Customer-wise Dispatch" subtitle="Total dispatch weight per customer (kg)" loading={loading} empty={analytics.customerWiseDispatch.length === 0} accentColor="#01579b">
        <ResponsiveContainer width="100%" height={260} minWidth={440} minHeight={260}>
          <BarChart layout="vertical" data={analytics.customerWiseDispatch} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}kg`} />
            <YAxis dataKey="name" type="category" tick={{ ...axisStyle, fontSize: '0.65rem' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toLocaleString('en-IN')} kg`, 'Dispatched']} />
            <Bar dataKey="value" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {analytics.customerWiseDispatch.map((entry, idx) => (
                <Cell key={idx} fill={entry.color || BLUE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Vehicle Utilization */}
      <ChartCard title="Vehicle Utilization" subtitle="Number of dispatch trips per vehicle" loading={loading} empty={analytics.vehicleUtilization.length === 0} accentColor="#0277bd">
        <ResponsiveContainer width="100%" height={260} minWidth={440} minHeight={260}>
          <BarChart data={analytics.vehicleUtilization} margin={{ top: 8, right: 16, left: 0, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ ...axisStyle, fontSize: '0.6rem' }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} trips`} width={56} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [v, 'Trips']} />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {analytics.vehicleUtilization.map((entry, idx) => (
                <Cell key={idx} fill={entry.color || BLUE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Alloy-wise Dispatch */}
      <ChartCard
        title="Alloy-wise Dispatch"
        subtitle="Dispatch weight breakdown by alloy"
        loading={loading}
        empty={analytics.customerWiseDispatch.length === 0}
        accentColor="#039be5"
      >
        <ResponsiveContainer width="100%" height={260} minWidth={440} minHeight={260}>
          <PieChart>
            <Pie
              data={analytics.customerWiseDispatch.slice(0, 6)}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              outerRadius={90}
              innerRadius={45}
              paddingAngle={2}
              label={({ name, percent }) => percent !== undefined && percent > 0.06 ? `${name}` : ''}
              labelLine={false}
              isAnimationActive={false}
            >
              {analytics.customerWiseDispatch.slice(0, 6).map((entry, idx) => (
                <Cell key={idx} fill={entry.color || BLUE} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${Number(v).toLocaleString('en-IN')} kg`, 'Dispatched']} />
            <Legend wrapperStyle={{ fontSize: '0.65rem', fontWeight: 600 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

    </Box>
  </div>
);

export default DispatchSection;
