import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Button, TextField, Typography, InputAdornment, IconButton, CircularProgress, Alert,
} from "@mui/material";
import { Mail, Lock, Eye, EyeOff, Factory } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ProductionManagerLoginPage = () => {
  const { loginAsProductionManager } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginAsProductionManager(email, password);
      navigate("/production/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#ffffff" }}>
      {/* Left branding */}
      <Box sx={{
        display: { xs: "none", md: "flex" }, flex: 1, flexDirection: "column",
        justifyContent: "space-between", p: 6, position: "relative",
        background: "linear-gradient(160deg, #0d1b2a 0%, #1565C0 55%, #0288d1 100%)",
        overflow: "hidden",
        "&::before": { content: '""', position: "absolute", top: -80, right: -80, width: 400, height: 400, borderRadius: "50%", background: "rgba(255,255,255,0.04)" },
        "&::after": { content: '""', position: "absolute", bottom: -120, left: -60, width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.04)" },
      }}>
        <Box sx={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
          <img src="/logo.png" alt="SJMW" style={{ height: 40, width: 40, objectFit: "contain", borderRadius: 20 }} />
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.25rem" }}>Sri Jothi Moulding Works ERP</Typography>
        </Box>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
            <Box sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.12)", borderRadius: 2 }}>
              <Factory size={32} color="#fff" />
            </Box>
            <Box>
              <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.8rem", lineHeight: 1.1 }}>Production Manager</Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem" }}>Monitor · Review · Approve</Typography>
            </Box>
          </Box>
          {[
            {text: "Real-time production monitoring dashboard" },
            {text: "Review and forward completed heats" },
            {text: "Track efficiency, good & bad ingots" },
            {text: "Approve or return heats to supervisor" },
          ].map((item) => (
            <Box key={item.text} sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Typography sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.875rem" }}>{item.text}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography sx={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem" }}>
            © 2026 Sri Jothi Moulding Works · Powered by Procomets Solutions
          </Typography>
        </Box>
      </Box>

      {/* Right form */}
      <Box sx={{ flex: { xs: 1, md: 1.2 }, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", p: { xs: 4, sm: 6, md: 10 }, bgcolor: "#ffffff" }}>
        <Box sx={{ width: "100%", maxWidth: 400 }}>
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1.5, mb: 5 }}>
            <img src="/logo.png" alt="SJMW" style={{ height: 36, width: 36, objectFit: "contain" }} />
            <Typography sx={{ color: "#0f172a", fontWeight: 850, fontSize: "1.15rem" }}>Sri Jothi Moulding Works ERP</Typography>
          </Box>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, px: 1.5, py: 0.5, borderRadius: 10, bgcolor: "#eff6ff", border: "1px solid #bfdbfe", mb: 3 }}>
            <Factory size={13} color="#1565C0" />
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#1565C0", letterSpacing: 0.5 }}>PRODUCTION MANAGER PORTAL</Typography>
          </Box>
          <Typography variant="h4" sx={{ color: "#0f172a", fontWeight: 800, mb: 1, letterSpacing: -0.5 }}>Production Sign In</Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.875rem", mb: 4, lineHeight: 1.5 }}>
            Monitor production, review heats, and track efficiency in real time.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: "0.8rem" }}>{error}</Alert>}
          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField id="pm-email" label="Email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><Mail size={16} color="#94a3b8" /></InputAdornment> } }} sx={fieldSx} />
              <TextField id="pm-password" label="Password" type={showPassword ? "text" : "password"} fullWidth required value={password} onChange={(e) => setPassword(e.target.value)}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Lock size={16} color="#94a3b8" /></InputAdornment>,
                  endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: "#64748b" }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</IconButton></InputAdornment>,
                }}} sx={fieldSx} />
              <Button id="pm-submit" type="submit" fullWidth disabled={loading} sx={{ mt: 1.5, py: 1.5, fontWeight: 700, fontSize: "0.9rem", borderRadius: 2.5, textTransform: "none", background: "linear-gradient(135deg, #1976d2 0%, #1565C0 100%)", color: "#fff", boxShadow: "0 4px 14px rgba(21,101,192,0.4)", transition: "all 0.2s ease", "&:hover": { background: "linear-gradient(135deg, #1565C0 0%, #0d47a1 100%)", boxShadow: "0 6px 20px rgba(21,101,192,0.55)", transform: "translateY(-1px)" }, "&:disabled": { opacity: 0.6 } }}>
                {loading ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Sign In to Production Portal"}
              </Button>
            </Box>
          </form>
        </Box>
      </Box>
    </Box>
  );
};

const fieldSx = {
  "& .MuiOutlinedInput-root": { color: "#0f172a", borderRadius: 2.5, backgroundColor: "#ffffff", "& fieldset": { borderColor: "#e2e8f0" }, "&:hover fieldset": { borderColor: "#cbd5e1" }, "&.Mui-focused fieldset": { borderColor: "#1565C0", borderWidth: 2 } },
  "& .MuiInputLabel-root": { color: "#94a3b8", "&.Mui-focused": { color: "#1565C0" } },
};

export default ProductionManagerLoginPage;
