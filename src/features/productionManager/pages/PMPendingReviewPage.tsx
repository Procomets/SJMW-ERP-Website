import { useEffect, useState, useMemo } from "react";
import {
  Box, Card, CardContent, Typography, Chip, Button, CircularProgress, LinearProgress,
} from "@mui/material";
import { Clock3, Zap, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { subscribeToProductionLedger, approveReview } from "../services/productionManager.service";
import type { ProductionManagerEntry } from "../types/productionManager.types";
import { useAuth } from "../../../context/AuthContext";

const BLUE = "#1565C0";

const fmtDate = (ts: any) => {
  if (!ts) return "—";
  try { return ts.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
};

const PMPendingReviewPage = () => {
  const [entries, setEntries] = useState<ProductionManagerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [forwardingId, setForwardingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    const unsub = subscribeToProductionLedger((data) => { setEntries(data); setLoading(false); });
    return () => unsub();
  }, []);

  const pending = useMemo(() =>
    entries.filter((e) => !e.reviewStatus || e.reviewStatus === "Pending"),
    [entries]
  );

  const handleForward = async (id: string) => {
    setForwardingId(id);
    try {
      await approveReview(id, profile?.name || "Production Manager");
    } finally {
      setForwardingId(null);
    }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: BLUE }} /></Box>
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ p: 1, bgcolor: "#fff7ed", borderRadius: 2 }}><Clock3 size={22} color="#f97316" /></Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>Pending Review</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>Completed heats awaiting Production Manager review</Typography>
        </Box>
        <Chip label={`${pending.length} Pending`} sx={{ ml: "auto", bgcolor: "#fff7ed", color: "#f97316", fontWeight: 700, border: "1px solid #fed7aa" }} />
      </Box>

      {pending.length === 0 ? (
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 6, textAlign: "center" }}>
          <Typography sx={{ fontSize: "3rem", mb: 2 }}>✅</Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#1e293b", mb: 1 }}>All caught up!</Typography>
          <Typography sx={{ color: "#64748b", fontSize: "0.85rem" }}>No heats are currently pending review.</Typography>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" }, gap: 2.5 }}>
          {pending.map((heat) => {
            const eff = heat.efficiencyPercentage || 0;
            return (
              <Box key={heat.id}>
                <Card elevation={0} sx={{ height: "100%", border: "1px solid #e2e8f0", borderRadius: 3, transition: "all 0.2s", "&:hover": { boxShadow: "0 8px 24px rgba(0,0,0,0.1)", transform: "translateY(-2px)" } }}>
                  <CardContent sx={{ p: 2.5, display: "flex", flexDirection: "column", height: "100%" }}>
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: BLUE }}>{heat.heatNo}</Typography>
                        <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8", mt: 0.25 }}>{fmtDate(heat.date)}</Typography>
                      </Box>
                      <Chip label={heat.alloyType || "—"} size="small" sx={{ bgcolor: "#eff6ff", color: BLUE, fontWeight: 700, fontSize: "0.68rem" }} />
                    </Box>

                    {/* Info rows */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography sx={{ fontSize: "0.72rem", color: "#64748b", mb: 0.5 }}>Supervisor: <Box component="span" sx={{ fontWeight: 600, color: "#1e293b" }}>{heat.supervisorName || "—"}</Box></Typography>
                    </Box>

                    {/* Metrics */}
                    <Box sx={{ display: "flex", gap: 1, mb: 1.5 }}>
                      <Box sx={{ flex: 1, bgcolor: "#f0fdf4", borderRadius: 2, p: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                        <ThumbsUp size={13} color="#16a34a" />
                        <Box>
                          <Typography sx={{ fontSize: "0.65rem", color: "#64748b" }}>Good</Typography>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#16a34a" }}>{((heat.goodIngotsKg || heat.goodIngots || 0)).toFixed(1)} kg</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flex: 1, bgcolor: "#fff1f2", borderRadius: 2, p: 1, display: "flex", alignItems: "center", gap: 0.75 }}>
                        <ThumbsDown size={13} color="#dc2626" />
                        <Box>
                          <Typography sx={{ fontSize: "0.65rem", color: "#64748b" }}>Bad</Typography>
                          <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: "#dc2626" }}>{(heat.badIngotsKg || 0).toFixed(1)} kg</Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Efficiency */}
                    <Box sx={{ mb: 2, mt: "auto" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography sx={{ fontSize: "0.72rem", color: "#64748b", display: "flex", alignItems: "center", gap: 0.5 }}><Zap size={11} />Efficiency</Typography>
                        <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: eff >= 90 ? "#16a34a" : eff >= 75 ? "#f59e0b" : "#dc2626" }}>{eff.toFixed(1)}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={Math.min(eff, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: eff >= 90 ? "#16a34a" : eff >= 75 ? "#f59e0b" : "#dc2626", borderRadius: 3 } }} />
                    </Box>

                    {/* Actions */}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button size="small" variant="outlined" fullWidth sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.73rem", borderColor: BLUE, color: BLUE, fontWeight: 600 }} onClick={() => navigate(`/production/review/${heat.id}`)}>
                        Review
                      </Button>
                      <Button size="small" variant="contained" fullWidth startIcon={<Send size={12} />}
                        disabled={forwardingId === heat.id}
                        onClick={() => handleForward(heat.id)}
                        sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.73rem", bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, fontWeight: 600 }}>
                        {forwardingId === heat.id ? "Sending…" : "Forward"}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default PMPendingReviewPage;
