import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import ProductionManagerSidebar from "./ProductionManagerSidebar";
import Navbar from "./Navbar";

const DRAWER_WIDTH = 280;

const ProductionManagerLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      <Navbar handleDrawerToggle={() => setMobileOpen(!mobileOpen)} drawerWidth={DRAWER_WIDTH} />
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <ProductionManagerSidebar
          drawerWidth={DRAWER_WIDTH}
          mobileOpen={mobileOpen}
          handleDrawerToggle={() => setMobileOpen(!mobileOpen)}
          isMobile={isMobile}
        />
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { xs: "100%", md: `calc(100% - ${DRAWER_WIDTH}px)` }, maxWidth: "100%", overflowX: "hidden", mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default ProductionManagerLayout;
