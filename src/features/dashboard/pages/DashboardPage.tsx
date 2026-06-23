import { Box, Typography, Card, CardContent, Grid } from '@mui/material';
import { Factory, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const prodData = [
  { name: 'Mon', prod: 120, cost: 85 },
  { name: 'Tue', prod: 132, cost: 92 },
  { name: 'Wed', prod: 101, cost: 75 },
  { name: 'Thu', prod: 143, cost: 105 },
  { name: 'Fri', prod: 155, cost: 110 },
  { name: 'Sat', prod: 110, cost: 80 },
  { name: 'Sun', prod: 95, cost: 70 },
];

const KPICard = ({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="subtitle2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography variant="h4" color="textPrimary" sx={{ fontWeight: 700 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{
          backgroundColor: 'primary.light',
          borderRadius: 2,
          p: 1.5,
          color: 'primary.main',
          display: 'flex'
        }}>
          {icon}
        </Box>
      </Box>
      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <TrendingUp size={16} color="green" />
        <Typography variant="body2" color="success.main" sx={{ ml: 1, fontWeight: 600 }}>
          {trend}
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
          vs last month
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const DashboardPage = () => {
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
            Executive Dashboard
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Real-time overview of foundry operations and performance.
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="TOTAL PRODUCTION" value="1,245.5 T" icon={<Factory size={24} />} trend="+5.4%" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="REVENUE" value="$2.4M" icon={<DollarSign size={24} />} trend="+12.5%" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="PROFIT MARGIN" value="24.8%" icon={<TrendingUp size={24} />} trend="+2.1%" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard title="YIELD EFFICIENCY" value="94.2%" icon={<AlertTriangle size={24} />} trend="-0.4%" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Production & Cost Trend</Typography>
              <Box sx={{ flexGrow: 1, minHeight: 0, mt: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={prodData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1565C0" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1565C0" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ED6C02" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ED6C02" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="prod" stroke="#1565C0" fillOpacity={1} fill="url(#colorProd)" />
                    <Area type="monotone" dataKey="cost" stroke="#ED6C02" fillOpacity={1} fill="url(#colorCost)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: 400 }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Yield Analysis</Typography>
              <Box sx={{ flexGrow: 1, minHeight: 0, mt: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box sx={{ 
                  position: 'relative', 
                  width: 200, 
                  height: 200, 
                  borderRadius: '50%', 
                  border: '16px solid #e0e0e0',
                  borderTopColor: '#2E7D32',
                  borderRightColor: '#2E7D32',
                  transform: 'rotate(45deg)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Box sx={{ transform: 'rotate(-45deg)', textAlign: 'center' }}>
                    <Typography variant="h3" sx={{ fontWeight: 700, color: '#2E7D32' }}>94%</Typography>
                    <Typography variant="body2" color="textSecondary">Efficiency</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
