import { useEffect, useState, useMemo } from "react";
import {
  Box, Card, Typography, TextField, InputAdornment, Select, MenuItem,
  FormControl, InputLabel, Chip,Button, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
} from "@mui/material";
import { Search, FileDown, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { subscribeToProductionLedger } from "../services/productionManager.service";
import type { ProductionManagerEntry } from "../types/productionManager.types";

const BLUE = "#1565C0";

const fmtDate = (ts: any) => {
  if (!ts) return "—";
  try { return ts.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "—"; }
};

const PAGE_SIZE = 20;

const PMApprovedProductionPage = () => {
  const [entries, setEntries] = useState<ProductionManagerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAlloy, setFilterAlloy] = useState("All");
  const [page, setPage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = subscribeToProductionLedger((data) => { setEntries(data); setLoading(false); });
    return () => unsub();
  }, []);

  const reviewed = useMemo(() =>
    entries.filter((e) => e.reviewStatus === "Reviewed" || e.reviewStatus === "Approved"),
    [entries]
  );

  const alloys = useMemo(() => ["All", ...Array.from(new Set(reviewed.map((e) => e.alloyType).filter(Boolean)))], [reviewed]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return reviewed.filter((e) =>
      (filterAlloy === "All" || e.alloyType === filterAlloy) &&
      (!q || e.heatNo?.toLowerCase().includes(q) || e.supervisorName?.toLowerCase().includes(q))
    );
  }, [reviewed, search, filterAlloy]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Heat No", "Date", "Alloy", "Supervisor", "Total Input (kg)", "Good Ingots (kg)", "Bad Ingots (kg)", "Efficiency (%)", "Reviewed By", "Reviewed At"];
    const rows = filtered.map((e) => [
      e.heatNo, fmtDate(e.date), e.alloyType, e.supervisorName || "",
      e.totalInputKg || e.totalInput, e.goodIngotsKg || e.goodIngots, e.badIngotsKg || 0,
      e.efficiencyPercentage?.toFixed(1), e.reviewedBy || "", fmtDate(e.reviewedAt),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "approved_production.csv"; a.click();
  };

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ p: 1, bgcolor: "#f0fdf4", borderRadius: 2 }}><CheckCircle2 size={22} color="#16a34a" /></Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>Approved Production</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>All reviewed and approved heat records</Typography>
        </Box>
        <Chip label={`${filtered.length} Records`} sx={{ ml: "auto", bgcolor: "#f0fdf4", color: "#16a34a", fontWeight: 700, border: "1px solid #bbf7d0" }} />
      </Box>

      {/* Filters */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2, mb: 2.5 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center" }}>
          <TextField size="small" placeholder="Search heat, supervisor…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={15} color="#94a3b8" /></InputAdornment> } }}
            sx={{ width: 260, "& .MuiOutlinedInput-root": { borderRadius: 2 } }} />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Alloy</InputLabel>
            <Select value={filterAlloy} label="Alloy" onChange={(e) => { setFilterAlloy(e.target.value); setPage(0); }}>
              {alloys.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
          <Box sx={{ ml: "auto" }}>
            <Button size="small" variant="outlined" startIcon={<FileDown size={14} />} onClick={exportCSV} sx={{ borderRadius: 2, textTransform: "none", fontSize: "0.75rem" }}>Export CSV</Button>
          </Box>
        </Box>
      </Card>

      {/* Table */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: BLUE }} /></Box>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    {["Heat No", "Date", "Alloy", "Supervisor", "Good Ingots", "Bad Ingots", "Efficiency", "Reviewed By", "Reviewed At", "Status"].map((h) => (
                      <TableCell key={h} sx={{ bgcolor: "#f8fafc", fontWeight: 700, fontSize: "0.72rem", color: "#475569", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "2px solid #e2e8f0", whiteSpace: "nowrap" }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginated.map((row) => {
                    const eff = row.efficiencyPercentage || 0;
                    return (
                      <TableRow key={row.id} hover sx={{ "&:hover": { bgcolor: "#f8fafc" }, cursor: "pointer" }} onClick={() => navigate(`/production/ledger/${row.id}`)}>
                        <TableCell sx={{ fontWeight: 700, color: BLUE, fontSize: "0.8rem" }}>{row.heatNo}</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem" }}>{fmtDate(row.date)}</TableCell>
                        <TableCell><Chip label={row.alloyType || "—"} size="small" sx={{ fontSize: "0.68rem", height: 20 }} /></TableCell>
                        <TableCell sx={{ fontSize: "0.78rem" }}>{row.supervisorName || "—"}</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: "#16a34a", fontWeight: 600 }}>{((row.goodIngotsKg || row.goodIngots || 0)).toFixed(1)} kg</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 600 }}>{(row.badIngotsKg || 0).toFixed(1)} kg</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem", fontWeight: 700, color: eff >= 90 ? "#16a34a" : eff >= 75 ? "#f59e0b" : "#dc2626" }}>{eff.toFixed(1)}%</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem" }}>{row.reviewedBy || "—"}</TableCell>
                        <TableCell sx={{ fontSize: "0.78rem" }}>{fmtDate(row.reviewedAt)}</TableCell>
                        <TableCell>
                          <Chip label={row.reviewStatus} color={row.reviewStatus === "Approved" ? "success" : "primary"} size="small" sx={{ fontSize: "0.68rem", height: 20, fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {paginated.length === 0 && (
                    <TableRow><TableCell colSpan={10} sx={{ textAlign: "center", py: 5, color: "#94a3b8" }}>No reviewed records yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 2, py: 1.5, borderTop: "1px solid #e2e8f0" }}>
              <Typography sx={{ fontSize: "0.75rem", color: "#64748b" }}>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" disabled={page === 0} onClick={() => setPage(page - 1)} sx={{ textTransform: "none", fontSize: "0.75rem" }}>Prev</Button>
                <Typography sx={{ fontSize: "0.75rem", color: "#64748b", alignSelf: "center" }}>{page + 1} / {totalPages || 1}</Typography>
                <Button size="small" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)} sx={{ textTransform: "none", fontSize: "0.75rem" }}>Next</Button>
              </Box>
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
};

export default PMApprovedProductionPage;
