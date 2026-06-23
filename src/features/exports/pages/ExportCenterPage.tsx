import { Box, Typography, Card, CardContent } from '@mui/material';

const ExportCenterPage = () => {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Export Center
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Export operations data to Excel, CSV, or PDF.
        </Typography>
      </Box>

      <Card>
        <CardContent>
          <Box sx={{ height: 400, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Typography color="textSecondary">Export Center placeholder</Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ExportCenterPage;
