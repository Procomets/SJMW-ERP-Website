import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Button,
} from "@mui/material";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Factory, LogOut, PackageSearch, ShieldCheck, IndianRupee } from "lucide-react";
import { useAuth } from "../context/AuthContext";


interface SidebarProps {
  drawerWidth: number;
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  isMobile: boolean;
}

const BLUE = "#1565C0";
const BLUE_LIGHT = "#eff6ff";
const BLUE_BORDER = "#bfdbfe";
const BLUE_ACTIVE_BG = "#dbeafe";

const MENU = [
  { text: "Quality Control", icon: <ShieldCheck size={20} />, path: "/production/quality-control" },
  { text: "Cost Ledger", icon: <IndianRupee size={20} />, path: "/production/cost-ledger" },
  { text: "Warehouse", icon: <PackageSearch size={20} />, path: "/production/warehouse" },
];

const ProductionManagerSidebar = ({ drawerWidth, mobileOpen, handleDrawerToggle, isMobile }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, profile, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/production-login", { replace: true });
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Box sx={{ height: 64, display: "flex", alignItems: "center", px: 2, gap: 1.5, borderBottom: `1px solid ${BLUE_BORDER}`, background: "linear-gradient(135deg, #0d1b2a, #1565C0)" }}>
        <img src="/logo.png" alt="SJMW Logo" style={{ height: 36, width: 36, objectFit: "contain" }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.1, color: "#fff", fontSize: "0.8rem" }}>Sri Jothi Moulding Works</Typography>
          <Typography sx={{ fontSize: "0.6rem", color: "#93c5fd", fontWeight: 600, letterSpacing: 0.5 }}>PRODUCTION PORTAL</Typography>
        </Box>
      </Box>

      {/* Role badge */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 1, bgcolor: BLUE_LIGHT, borderRadius: 2, border: `1px solid ${BLUE_BORDER}` }}>
          <Factory size={14} color={BLUE} />
          <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e3a5f", letterSpacing: 0.3 }}>Production Manager</Typography>
        </Box>
      </Box>

      {/* Nav */}
      <Box sx={{ overflow: "auto", flex: 1, py: 1 }}>
        <Typography sx={{ px: 3, pb: 1, fontSize: "0.58rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Modules</Typography>
        <List sx={{ px: 1.5 }}>
          {MENU.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={isMobile ? handleDrawerToggle : undefined}
                  sx={{ borderRadius: 2, backgroundColor: isActive ? BLUE_ACTIVE_BG : "transparent", border: isActive ? `1px solid ${BLUE_BORDER}` : "1px solid transparent", color: isActive ? "#1e3a5f" : "#374151", "&:hover": { backgroundColor: BLUE_LIGHT } }}
                >
                  <ListItemIcon sx={{ color: isActive ? BLUE : "#6b7280", minWidth: 38 }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ "& .MuiListItemText-primary": { fontSize: "0.85rem", fontWeight: isActive ? 700 : 500, color: isActive ? "#1e3a5f" : "#1e293b" } }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Divider sx={{ borderColor: "#dbeafe" }} />

      {/* User info + logout */}
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {profile && (
          <Box sx={{ px: 0.5, mb: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#1e293b", fontSize: "0.8rem" }} noWrap>{profile.name}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }} noWrap>{user?.email}</Typography>
          </Box>
        )}
        <Button variant="outlined" size="small" startIcon={<LogOut size={16} />} onClick={handleLogout} fullWidth
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, borderColor: BLUE_BORDER, color: BLUE, "&:hover": { bgcolor: BLUE_LIGHT, borderColor: BLUE } }}>
          Logout
        </Button>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ fontSize: "0.6rem", mt: 0.5 }}>
          Copyrights © 2026 by Procomets Solutions · v1.0.0
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: "none", boxShadow: "4px 0 24px rgba(0,0,0,0.08)" } }}>
        {drawer}
      </Drawer>
      <Drawer variant="permanent" sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth, borderRight: `1px solid ${BLUE_BORDER}` } }} open>
        {drawer}
      </Drawer>
    </>
  );
};

export default ProductionManagerSidebar;
