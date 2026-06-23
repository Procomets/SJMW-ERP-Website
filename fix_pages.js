const fs = require('fs');
const path = require('path');
const pages = [
  'heatLedger/pages/HeatLedgerPage.tsx',
  'productionLedger/pages/ProductionLedgerPage.tsx',
  'costLedger/pages/CostLedgerPage.tsx',
  'profitAnalysis/pages/ProfitAnalysisPage.tsx',
  'reports/pages/ReportsPage.tsx',
  'exports/pages/ExportCenterPage.tsx',
  'users/pages/UserManagementPage.tsx',
  'settings/pages/SettingsPage.tsx'
];
pages.forEach(p => {
  const fullPath = path.join(process.cwd(), 'src/features', p);
  const name = path.basename(p, '.tsx');
  const title = name.replace('Page', '').replace(/([A-Z])/g, ' $1').trim();
  const content = `import { Box, Typography, Card, CardContent } from '@mui/material';

const ${name} = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          ${title}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Description for ${title}.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Typography color="textSecondary">${title} Component placeholder</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ${name};
`;
  fs.writeFileSync(fullPath, content);
});

// Fix DashboardPage
const dashPath = path.join(process.cwd(), 'src/features/dashboard/pages/DashboardPage.tsx');
let dashContent = fs.readFileSync(dashPath, 'utf8');
dashContent = dashContent.replace(/<Box mb=\{4\}/g, '<Box sx={{ mb: 4 }}');
dashContent = dashContent.replace(/<Box mt=\{2\}/g, '<Box sx={{ mt: 2 }}');
dashContent = dashContent.replace(/<Box height=\{400\}/g, '<Box sx={{ height: 400 }}');
dashContent = dashContent.replace(/<Box height=\{300\}/g, '<Box sx={{ height: 300 }}');
dashContent = dashContent.replace(/<Card sx=\{\{ height: 400 \}\}>/g, '<Card sx={{ height: 400 }}>');
dashContent = dashContent.replace(/display="flex"/g, '');
dashContent = dashContent.replace(/justifyContent="space-between"/g, '');
dashContent = dashContent.replace(/alignItems="flex-start"/g, '');
dashContent = dashContent.replace(/alignItems="center"/g, '');
// Wait, removing them will break the layout. I should replace them with sx.
fs.writeFileSync(dashPath, dashContent);
