import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DRAWER_WIDTH = 280;

const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar 
        handleDrawerToggle={handleDrawerToggle} 
        drawerWidth={DRAWER_WIDTH}
      />
      
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Sidebar 
          drawerWidth={DRAWER_WIDTH}
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          isMobile={isMobile}
        />
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8 // Margin top to account for the fixed Navbar
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
