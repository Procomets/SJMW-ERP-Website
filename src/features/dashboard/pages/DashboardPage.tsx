import { Box, Typography, Chip } from '@mui/material';
import { LayoutDashboard } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDashboardFilters } from '../hooks/useDashboardFilters';
import DashboardFiltersComponent from '../components/DashboardFilters';
import KpiCards from '../components/KpiCards';
import ProductionSection from '../components/ProductionSection';
import InventorySection from '../components/InventorySection';
import FinancialSection from '../components/FinancialSection';
import DispatchSection from '../components/DispatchSection';
import QualitySection from '../components/QualitySection';

const DashboardPage = () => {
  const { data, loading, lastRefreshed, refresh } = useDashboardData();
  const { filters, setFilters, filterOptions, analytics, filteredCounts } = useDashboardFilters(data);

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: '100%' }}>

      {/* ── Page Header ── */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Box sx={{ p: 1, background: 'linear-gradient(135deg,#1565C0,#1976d2)', borderRadius: 2, display: 'flex' }}>
              <LayoutDashboard size={22} color="#fff" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
              Executive Dashboard
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', ml: 6 }}>
            Real-time overview of all foundry operations
          </Typography>
        </Box>

        {/* Live counters */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label={`${filteredCounts.production} heats`}
            size="small"
            sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#1565C0', border: '1px solid #bfdbfe' }}
          />
          <Chip
            label={`${filteredCounts.dispatch} dispatches`}
            size="small"
            sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#0277bd', border: '1px solid #bfdbfe' }}
          />
          <Chip
            label={`${filteredCounts.qc} QC records`}
            size="small"
            sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #86efac' }}
          />
          {loading && (
            <Chip
              label="Loading…"
              size="small"
              sx={{ fontSize: '0.68rem', fontWeight: 700, bgcolor: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } } }}
            />
          )}
        </Box>
      </Box>

      {/* ── Global Filters ── */}
      <DashboardFiltersComponent
        filters={filters}
        setFilters={setFilters}
        filterOptions={filterOptions}
        lastRefreshed={lastRefreshed}
        onRefresh={refresh}
        loading={loading}
      />

      {/* ── KPI Cards ── */}
      <KpiCards kpis={analytics.kpis} loading={loading} />

      {/* ── Section 2: Production Analytics ── */}
      <ProductionSection analytics={analytics} loading={loading} />

      {/* ── Section 3: Inventory Analytics ── */}
      <InventorySection analytics={analytics} inventoryItems={data.inventoryItems} loading={loading} />

      {/* ── Section 4: Financial Analytics ── */}
      <FinancialSection analytics={analytics} loading={loading} />

      {/* ── Section 5: Dispatch Analytics ── */}
      <DispatchSection analytics={analytics} loading={loading} />

      {/* ── Section 6: Quality & Efficiency Analytics ── */}
      <QualitySection analytics={analytics} loading={loading} />

      {/* Bottom spacer */}
      <Box sx={{ height: 40 }} />
    </Box>
  );
};

export default DashboardPage;
