import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box, Card, Typography, Button, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, LinearProgress, Alert,
} from "@mui/material";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import { approveReview, returnToSupervisor } from "../services/productionManager.service";
import type { ProductionManagerEntry } from "../types/productionManager.types";
import { useAuth } from "../../../context/AuthContext";

const BLUE = "#1565C0";

const fmtDate = (ts: any) => {
  if (!ts) return "—";
  try { return ts.toDate().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
};

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <Box sx={{ display: "flex", py: 0.75, borderBottom: "1px solid #f1f5f9" }}>
    <Typography sx={{ width: 180, fontSize: "0.78rem", color: "#64748b", fontWeight: 600, flexShrink: 0 }}>{label}</Typography>
    <Typography sx={{ fontSize: "0.78rem", color: "#1e293b", fontWeight: 500 }}>{(value ?? "") || "—"}</Typography>
  </Box>
);

const PMReviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [entry, setEntry] = useState<ProductionManagerEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [returnDialog, setReturnDialog] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnComments, setReturnComments] = useState("");
  const [returning, setReturning] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "productionLedger", id)).then(d => {
      if (d.exists()) setEntry({ id: d.id, reviewStatus: "Pending", ...d.data() } as ProductionManagerEntry);
      setLoading(false);
    });
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true); setError(null);
    try {
      await approveReview(id, profile?.name || "Production Manager");
      setSuccess("Heat has been reviewed and forwarded to Admin for approval.");
      setTimeout(() => navigate("/production/pending-review"), 2000);
    } catch (e: any) { setError(e.message); } finally { setApproving(false); }
  };

  const handleReturn = async () => {
    if (!id || !returnReason.trim()) return;
    setReturning(true); setError(null);
    try {
      await returnToSupervisor(id, returnReason, returnComments, profile?.name || "Production Manager");
      setReturnDialog(false);
      setSuccess("Heat has been returned to the supervisor with the provided reason.");
      setTimeout(() => navigate("/production/pending-review"), 2000);
    } catch (e: any) { setError(e.message); } finally { setReturning(false); }
  };

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: BLUE }} /></Box>
  );
  if (!entry) return (
    <Box sx={{ textAlign: "center", py: 8 }}>
      <Typography sx={{ color: "#64748b" }}>Heat not found.</Typography>
      <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
    </Box>
  );

  const eff = entry.efficiencyPercentage || 0;
  const isReviewed = entry.reviewStatus === "Reviewed" || entry.reviewStatus === "Approved";

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate(-1)} variant="outlined" size="small" sx={{ borderRadius: 2, textTransform: "none" }}>Back</Button>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>Review Heat #{entry.heatNo}</Typography>
          <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>All data is read-only. Only review actions are permitted.</Typography>
        </Box>
      </Box>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {isReviewed && <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>This heat has already been reviewed.</Alert>}

      {/* 2-column grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>
        {/* Heat Info */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 2, color: BLUE }}>Heat Information</Typography>
            <InfoRow label="Heat Number" value={entry.heatNo} />
            <InfoRow label="Date" value={fmtDate(entry.date)} />
            <InfoRow label="Furnace No" value={entry.furnaceNo} />
            <InfoRow label="Supervisor" value={entry.supervisorName} />
            <InfoRow label="Operator" value={entry.operatorName} />
            <InfoRow label="Alloy Type" value={entry.alloyType} />
            <InfoRow label="Shift" value={entry.shiftStartTime ? `${entry.shiftStartTime} ${entry.shiftStartPeriod} – ${entry.shiftEndTime} ${entry.shiftEndPeriod}` : "—"} />
          </Card>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 1.5, color: BLUE }}>Remarks</Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.7, bgcolor: "#f8fafc", borderRadius: 2, p: 1.5, border: "1px solid #f1f5f9" }}>{entry.remarks || "No remarks recorded."}</Typography>
          </Card>
        </Box>

        {/* Output + Materials */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 2, color: BLUE }}>Production Output</Typography>
            <InfoRow label="Total Input (kg)" value={(entry.totalInputKg || entry.totalInput || 0).toFixed(2)} />
            <InfoRow label="Good Ingots (kg)" value={(entry.goodIngotsKg || entry.goodIngots || 0).toFixed(2)} />
            <InfoRow label="Bad Ingots (kg)" value={(entry.badIngotsKg || 0).toFixed(2)} />
            <InfoRow label="No. of Pieces" value={entry.noOfPieces || entry.totalPieces || "—"} />
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b" }}>Efficiency</Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color: eff >= 90 ? "#16a34a" : eff >= 75 ? "#f59e0b" : "#dc2626" }}>{eff.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={Math.min(eff, 100)} sx={{ height: 8, borderRadius: 4, bgcolor: "#f1f5f9", "& .MuiLinearProgress-bar": { bgcolor: eff >= 90 ? "#16a34a" : eff >= 75 ? "#f59e0b" : "#dc2626", borderRadius: 4 } }} />
            </Box>
          </Card>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", mb: 2, color: BLUE }}>Materials Used</Typography>
            {(entry.materials || []).map((m, i) => (
              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.6, borderBottom: "1px solid #f8fafc" }}>
                <Typography sx={{ fontSize: "0.78rem", color: "#1e293b" }}>{m.materialName} <Typography component="span" sx={{ fontSize: "0.68rem", color: "#94a3b8" }}>({m.materialCode})</Typography></Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "#1e293b" }}>{m.weightKg?.toFixed(2)} kg</Typography>
              </Box>
            ))}
          </Card>
        </Box>
      </Box>

      {/* Review Action Bar */}
      {!isReviewed && (
        <Card elevation={0} sx={{ border: "2px solid #bfdbfe", borderRadius: 3, p: 2.5, bgcolor: "#f8faff", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e3a5f" }}>Ready to review this heat?</Typography>
            <Typography sx={{ fontSize: "0.78rem", color: "#64748b" }}>Approve to forward to Admin or return to supervisor with a reason.</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="outlined" color="error" startIcon={<RotateCcw size={15} />} onClick={() => setReturnDialog(true)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
              Return to Supervisor
            </Button>
            <Button variant="contained" startIcon={<CheckCircle2 size={15} />} onClick={handleApprove} disabled={approving}
              sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
              {approving ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "Approve Review"}
            </Button>
          </Box>
        </Card>
      )}

      {/* Return Dialog — no PaperProps, use sx on Dialog Paper via slotProps */}
      <Dialog open={returnDialog} onClose={() => setReturnDialog(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem", color: "#dc2626" }}>Return to Supervisor</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.82rem", color: "#64748b", mb: 2 }}>Please provide a reason and any additional comments. The supervisor will see this when they open the production entry.</Typography>
          <TextField label="Reason *" fullWidth value={returnReason} onChange={e => setReturnReason(e.target.value)} multiline rows={2} sx={{ mb: 2 }} />
          <TextField label="Additional Comments" fullWidth value={returnComments} onChange={e => setReturnComments(e.target.value)} multiline rows={3} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReturnDialog(false)} sx={{ textTransform: "none" }}>Cancel</Button>
          <Button onClick={handleReturn} disabled={returning || !returnReason.trim()} variant="contained" color="error" sx={{ textTransform: "none", borderRadius: 2 }}>
            {returning ? "Returning…" : "Return to Supervisor"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PMReviewPage;
