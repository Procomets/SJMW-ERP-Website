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
