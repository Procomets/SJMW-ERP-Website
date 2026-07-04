import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Card, Typography, Chip, Button, CircularProgress,
  Stepper, Step, StepLabel, LinearProgress,
} from "@mui/material";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import type { ProductionManagerEntry } from "../types/productionManager.types";

const BLUE = "#1565C0";

const fmtDate = (ts: any) => {
  if (!ts) return "—";
  try { return ts.toDate().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f97316", Reviewed: "#2563eb", Approved: "#16a34a", Returned: "#dc2626", Draft: "#94a3b8",
};

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ display: "flex", py: 0.75, borderBottom: "1px solid #f1f5f9" }}>
    <Typography sx={{ width: 180, fontSize: "0.78rem", color: "#64748b", fontWeight: 600, flexShrink: 0 }}>{label}</Typography>
    <Typography sx={{ fontSize: "0.78rem", color: "#1e293b", fontWeight: 500 }}>{value ?? "" || "—"}</Typography>
  </Box>
);

const PMHeatDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<ProductionManagerEntry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "productionLedger", id)).then(d => {
      if (d.exists()) setEntry({ id: d.id, reviewStatus: "Pending", ...d.data() } as ProductionManagerEntry);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: BLUE }} /></Box>
  );
  if (!entry) return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography sx={{ color: "#64748b" }}>Heat not found.</Typography>
      <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
    </Box>
  );

  const rs = entry.reviewStatus || "Pending";
  const eff = entry.efficiencyPercentage || 0;

  const timelineSteps = [
    { label: "Created", date: fmtDate(entry.createdAt), done: true },
    { label: "Production Complete", date: entry.productionStatus === "Completed" ? fmtDate(entry.updatedAt) : "Pending", done: entry.productionStatus === "Completed" },
    { label: "QC Reviewed", date: rs === "Reviewed" || rs === "Approved" ? fmtDate(entry.reviewedAt) : "Pending", done: rs === "Reviewed" || rs === "Approved" },
    { label: "Admin Approved", date: rs === "Approved" ? "Approved" : "Pending", done: rs === "Approved" },
  ];

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} variant="outlined" size="small" sx={{ borderRadius: 2, textTransform: "none" }}>Back</Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>Heat #{entry.heatNo}</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>Read-only heat detail view</Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Chip label={rs} size="small" sx={{ bgcolor: STATUS_COLORS[rs] + "22", color: STATUS_COLORS[rs], fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${STATUS_COLORS[rs]}44` }} />
          {rs === "Pending" && (
            <>
              <Button size="small" variant="contained" startIcon={<CheckCircle2 size={14} />} onClick={() => navigate(`/production/review/${id}`)}
                sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, borderRadius: 2, textTransform: "none", fontSize: "0.78rem" }}>
                Review
              </Button>
              <Button size="small" variant="outlined" color="error" startIcon={<RotateCcw size={14} />} onClick={() => navigate(`/production/review/${id}`)}>
                Return
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* 2-column grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
        {/* Heat Information */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 2, color: BLUE }}>Heat Information</Typography>
          <InfoRow label="Heat Number" value={entry.heatNo} />
          <InfoRow label="Date" value={fmtDate(entry.date)} />
          <InfoRow label="Furnace No" value={entry.furnaceNo} />
          <InfoRow label="Supervisor" value={entry.supervisorName} />
          <InfoRow label="Operator" value={entry.operatorName} />
          <InfoRow label="Alloy Type" value={entry.alloyType} />
          <InfoRow label="Shift Start" value={entry.shiftStartTime ? `${entry.shiftStartTime} ${entry.shiftStartPeriod}` : "—"} />
          <InfoRow label="Shift End" value={entry.shiftEndTime ? `${entry.shiftEndTime} ${entry.shiftEndPeriod}` : "—"} />
        </Card>

        {/* Production Output */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 2, color: BLUE }}>Production Output</Typography>
          <InfoRow label="Total Input (kg)" value={(entry.totalInputKg || entry.totalInput || 0).toFixed(2)} />
          <InfoRow label="Good Ingots (kg)" value={(entry.goodIngotsKg || entry.goodIngots || 0).toFixed(2)} />
          <InfoRow label="Bad Ingots (kg)" value={(entry.badIngotsKg || 0).toFixed(2)} />
          <InfoRow label="No. of Pieces" value={entry.noOfPieces || entry.totalPieces} />
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>Efficiency</Typography>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: eff >= 90 ? "#16a34a" : eff >= 75 ? "#f59e0b" : "#dc2626" }}>{eff.toFixed(1)}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={Math.min(eff, 100)} sx={{ height: 8, borderRadius: 4, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: eff >= 90 ? "#16a34a" : eff >= 75 ? "#f59e0b" : "#dc2626", borderRadius: 4 } }} />
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>Expected: {entry.expectedEfficiencyPercentage || 90}%</Typography>
              <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>Actual: {eff.toFixed(1)}%</Typography>
            </Box>
          </Box>
        </Card>

        {/* Materials Used */}
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 2, color: BLUE }}>Materials Used</Typography>
          {(entry.materials || []).length === 0 ? (
            <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8" }}>No materials recorded</Typography>
          ) : (
            <Box>
              <Box sx={{ display: "flex", pb: 1, borderBottom: "2px solid #f1f5f9", mb: 1 }}>
                <Typography sx={{ flex: 1, fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Material</Typography>
                <Typography sx={{ width: 80, fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", textAlign: "right" }}>Weight (kg)</Typography>
              </Box>
              {entry.materials.map((m, i) => (
                <Box key={i} sx={{ display: "flex", py: 0.6, borderBottom: "1px solid #f8fafc" }}>
                  <Typography sx={{ flex: 1, fontSize: "0.78rem", color: "#1e293b" }}>{m.materialName} <Typography component="span" sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>({m.materialCode})</Typography></Typography>
                  <Typography sx={{ width: 80, fontSize: "0.78rem", fontWeight: 600, color: "#1e293b", textAlign: "right" }}>{m.weightKg?.toFixed(2)}</Typography>
                </Box>
              ))}
              <Box sx={{ display: "flex", pt: 1, borderTop: "2px solid #e2e8f0", mt: 1 }}>
                <Typography sx={{ flex: 1, fontSize: "0.78rem", fontWeight: 700, color: "#1e293b" }}>Total</Typography>
                <Typography sx={{ width: 80, fontSize: "0.78rem", fontWeight: 800, color: BLUE, textAlign: "right" }}>
                  {entry.materials.reduce((s, m) => s + (m.weightKg || 0), 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </Card>

        {/* Remarks + Timeline */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1.5, color: BLUE }}>Remarks</Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.7 }}>{entry.remarks || "No remarks recorded."}</Typography>
          </Card>
          {entry.returnReason && (
            <Card elevation={0} sx={{ border: "1px solid #fecaca", borderRadius: 3, p: 2.5, bgcolor: "#fff1f2" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1, color: "#dc2626" }}>Return Reason</Typography>
              <Typography sx={{ fontSize: "0.82rem", color: "#7f1d1d", fontWeight: 600 }}>{entry.returnReason}</Typography>
              {entry.returnComments && <Typography sx={{ fontSize: "0.78rem", color: "#991b1b", mt: 0.5 }}>{entry.returnComments}</Typography>}
            </Card>
          )}
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 2, color: BLUE }}>Production Timeline</Typography>
            <Stepper orientation="vertical" activeStep={timelineSteps.filter(s => s.done).length - 1}>
              {timelineSteps.map(step => (
                <Step key={step.label} completed={step.done}>
                  <StepLabel>
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 600 }}>{step.label}</Typography>
                    <Typography sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>{step.date}</Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default PMHeatDetailPage;
