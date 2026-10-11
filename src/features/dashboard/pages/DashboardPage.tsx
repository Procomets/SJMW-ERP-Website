import { useState } from 'react';
import { Box, Typography, Chip, Button, Backdrop, CircularProgress } from '@mui/material';
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
import ExportPdfButton from '../../../components/common/ExportPdfButton';
import ExportExcelButton from '../../../components/common/ExportExcelButton';
import { exportDashboardPdf } from '../utils/dashboardPdfExport';
import { exportDashboardExcel } from '../utils/dashboardExcelExport';

// Revamped Overview Cards
import ProductionPerformanceCard from '../components/ProductionPerformanceCard';

type DashboardTab = 'overview' | 'production' | 'inventory' | 'financial' | 'dispatch' | 'quality';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const { data, loading, lastRefreshed, refresh } = useDashboardData();
  const { filters, setFilters, filterOptions, analytics, filteredCounts, range } = useDashboardFilters(data);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const tabLabels: Record<DashboardTab, string> = {
        overview: 'Executive Overview',
        production: 'Production Analytics',
        inventory: 'Inventory Analytics',
        financial: 'Financial Analytics',
        dispatch: 'Dispatch Analytics',
        quality: 'Quality & Efficiency',
      };
      await exportDashboardPdf({
        filters,
        activeTabLabel: tabLabels[activeTab],
        containerId: 'all-dashboard-sections-pdf-container',
        lastRefreshed,
      });
    } catch (err) {
      console.error('Failed to export dashboard PDF', err);
      alert('Failed to generate dashboard PDF report. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await exportDashboardExcel({
        filters,
        data,
        range,
      });
    } catch (err) {
      console.error('Failed to export dashboard Excel', err);
      alert('Failed to generate dashboard Excel report. Please try again.');
    } finally {
      setExportingExcel(false);
    }
  };

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

        {/* Live counters & Download PDF */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
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

          <ExportPdfButton
            onClick={handleExportPdf}
            disabled={exportingPdf || exportingExcel || loading}
            sx={{ height: 36, fontSize: '0.75rem', px: 2, borderRadius: 2 }}
          >
            {exportingPdf ? 'Generating PDF...' : 'Download Dashboard PDF'}
          </ExportPdfButton>

          <ExportExcelButton
            onClick={handleExportExcel}
            disabled={exportingExcel || exportingPdf || loading}
            sx={{ height: 36, fontSize: '0.75rem', px: 2, borderRadius: 2 }}
          >
            {exportingExcel ? 'Exporting Excel...' : 'Download Excel Report'}
          </ExportExcelButton>
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

      {/* ── Dashboard Navigation Tabs ── */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1, width: '100%', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {[
          { value: 'overview', label: 'Executive Overview' },
          { value: 'production', label: 'Production Analytics' },
          { value: 'inventory', label: 'Inventory Analytics' },
          { value: 'financial', label: 'Financial Analytics' },
          { value: 'dispatch', label: 'Dispatch Analytics' },
          { value: 'quality', label: 'Quality & Efficiency' },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'contained' : 'outlined'}
            onClick={() => setActiveTab(tab.value as DashboardTab)}
            sx={{
              borderRadius: 3,
              textTransform: 'none',
              fontSize: '0.72rem',
              fontWeight: 800,
              px: 2,
              py: 0.6,
              bgcolor: activeTab === tab.value ? '#1e293b' : 'transparent',
              color: activeTab === tab.value ? '#ffffff' : '#64748b',
              borderColor: activeTab === tab.value ? '#1e293b' : '#e2e8f0',
              flexShrink: 0,
              '&:hover': {
                bgcolor: activeTab === tab.value ? '#0f172a' : '#f8fafc',
                borderColor: activeTab === tab.value ? '#0f172a' : '#cbd5e1',
              }
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* ── Visible Active Tab Content ── */}
      <Box id="dashboard-report-content">
        {activeTab === 'overview' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Row 1: Production Performance Chart (Full Width) */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
              <Box sx={{ minWidth: 0 }}>
                <ProductionPerformanceCard
                  analytics={analytics}
                  kpi={analytics.kpis[0]}
                  filters={filters}
                  setFilters={setFilters}
                />
              </Box>
            </Box>
          </Box>
        )}

        {activeTab === 'production' && (
          <Box>
            <KpiCards kpis={analytics.kpis.filter(k => ['Total Production', 'Avg Recovery', 'Production Hours'].includes(k.label))} loading={loading} />
            <ProductionSection analytics={analytics} loading={loading} />
          </Box>
        )}

        {activeTab === 'inventory' && (
          <Box>
            <KpiCards kpis={analytics.kpis.filter(k => ['Raw Material Stock', 'Total Input Material', 'Finished Stock'].includes(k.label))} loading={loading} />
            <InventorySection analytics={analytics} inventoryItems={data.inventoryItems} loading={loading} />
          </Box>
        )}

        {activeTab === 'financial' && (
          <Box>
            <KpiCards kpis={analytics.kpis.filter(k => ['Avg Production Cost', 'Avg Selling Price'].includes(k.label))} loading={loading} />
            <FinancialSection analytics={analytics} loading={loading} />
          </Box>
        )}

        {activeTab === 'dispatch' && (
          <Box>
            <KpiCards kpis={analytics.kpis.filter(k => ['Total Dispatch'].includes(k.label))} loading={loading} />
            <DispatchSection analytics={analytics} loading={loading} />
          </Box>
        )}

        {activeTab === 'quality' && (
          <Box>
            <KpiCards kpis={analytics.kpis.filter(k => ['Avg Recovery', 'QC Pass Rate'].includes(k.label))} loading={loading} />
            <QualitySection analytics={analytics} loading={loading} />
          </Box>
        )}
      </Box>

      {/* ── Off-screen Comprehensive PDF Export Container (All Sections & Visualizations) ── */}
      <Box
        id="all-dashboard-sections-pdf-container"
        sx={{
          position: 'fixed',
          top: 0,
          left: '-9999px',
          width: '1000px',
          bgcolor: '#ffffff',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
          pointerEvents: 'none',
          zIndex: -9999,
          visibility: 'visible',
          opacity: 1,
        }}
      >
        {/* PAGE 1 / SECTION 1: PRODUCTION ANALYTICS */}
        <Box className="pdf-section-page" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ borderBottom: '2px solid #1565C0', pb: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#1565C0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              SECTION 1: PRODUCTION ANALYTICS & OVERVIEW
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              Sri Jothi Moulding Works — Operations Report
            </Typography>
          </Box>
          <KpiCards kpis={analytics.kpis.filter(k => ['Total Production', 'Avg Recovery', 'Production Hours'].includes(k.label))} loading={false} />
          <ProductionPerformanceCard analytics={analytics} kpi={analytics.kpis[0]} filters={filters} setFilters={setFilters} />
          <ProductionSection analytics={analytics} loading={false} />
        </Box>

        {/* PAGE 2 / SECTION 2: INVENTORY ANALYTICS */}
        <Box className="pdf-section-page" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ borderBottom: '2px solid #0284c7', pb: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              SECTION 2: INVENTORY ANALYTICS & STOCK LEVELS
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              Sri Jothi Moulding Works — Material Inventory
            </Typography>
          </Box>
          <KpiCards kpis={analytics.kpis.filter(k => ['Raw Material Stock', 'Total Input Material', 'Finished Stock'].includes(k.label))} loading={false} />
          <InventorySection analytics={analytics} inventoryItems={data.inventoryItems} loading={false} />
        </Box>

        {/* PAGE 3 / SECTION 3: FINANCIAL & DISPATCH DETAILS */}
        <Box className="pdf-section-page" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ borderBottom: '2px solid #059669', pb: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              SECTION 3: FINANCIAL ANALYTICS & DISPATCH DETAILS
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              Sri Jothi Moulding Works — Costs & Sales
            </Typography>
          </Box>
          <KpiCards kpis={analytics.kpis.filter(k => ['Avg Production Cost', 'Avg Selling Price', 'Total Dispatch'].includes(k.label))} loading={false} />
          <FinancialSection analytics={analytics} loading={false} />
          <DispatchSection analytics={analytics} loading={false} />
        </Box>

        {/* PAGE 4 / SECTION 4: QUALITY & EFFICIENCY */}
        <Box className="pdf-section-page" sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ borderBottom: '2px solid #7c3aed', pb: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              SECTION 4: QUALITY & EFFICIENCY ANALYTICS
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>
              Sri Jothi Moulding Works — Quality Assurance
            </Typography>
          </Box>
          <KpiCards kpis={analytics.kpis.filter(k => ['Avg Recovery', 'QC Pass Rate'].includes(k.label))} loading={false} />
          <QualitySection analytics={analytics} loading={false} />
        </Box>
      </Box>

      {/* ── High-Priority PDF Export Backdrop Overlay ── */}
      <Backdrop
        open={exportingPdf}
        sx={{
          zIndex: 999999,
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          backdropFilter: 'blur(6px)',
          bgcolor: 'rgba(15, 23, 42, 0.85)',
        }}
      >
        <CircularProgress color="primary" size={54} thickness={4} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: -0.3 }}>
          Generating Executive Dashboard PDF Report...
        </Typography>
        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
          Rendering Production, Inventory, Financial & Quality visualizations into PDF pages. Please wait...
        </Typography>
      </Backdrop>

      {/* Bottom spacer */}
      <Box sx={{ height: 40 }} />
    </Box>
  );
};

export default DashboardPage;
