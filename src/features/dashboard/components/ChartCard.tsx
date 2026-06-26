import { Card, CardContent, Skeleton, Typography, Box } from '@mui/material';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  empty?: boolean;
  height?: number;
  children: React.ReactNode;
  accentColor?: string;
  badge?: React.ReactNode;
}

const ChartCard = ({
  title, subtitle, loading, empty, height = 280, children, accentColor = '#1565C0', badge,
}: ChartCardProps) => (
  <Card sx={{
    borderRadius: 1.5,
    boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
    border: '1px solid #e2e8f0',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  }}>
    {/* Top accent bar */}
    <Box sx={{ height: 3, background: accentColor, flexShrink: 0 }} />
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5, '&:last-child': { pb: 2.5 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', letterSpacing: -0.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {badge}
      </Box>

      {/* Chart area */}
      <Box sx={{ flex: 1, minHeight: height }}>
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={height / 6} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        ) : empty ? (
          <Box sx={{ height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '1.4rem' }}>📊</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>No data for selected period</Typography>
          </Box>
        ) : children}
      </Box>
    </CardContent>
  </Card>
);

export default ChartCard;
