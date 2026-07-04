import { useEffect, useState, useMemo } from "react";
import { Box, Card, CardContent, Typography, Chip, CircularProgress } from "@mui/material";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { Factory, ThumbsUp, ThumbsDown, Zap, Clock, CheckCircle2, XCircle, Weight, CalendarDays } from "lucide-react";
import { subscribeToProductionLedger } from "../services/productionManager.service";
import type { ProductionManagerEntry } from "../types/productionManager.types";

const BLUE = "#1565C0";
const PIE_COLORS = ["#1565C0", "#0288d1", "#26a69a", "#f57c00", "#e53935", "#8e24aa"];
const STATUS_COLORS: Record<string, string> = {
  Pending: "#f97316", Reviewed: "#2563eb", Approved: "#16a34a", Returned: "#dc2626", Draft: "#94a3b8",
};

const todayStr = () => new Date().toDateString();
const fmtNum = (n: number) => n.toLocaleString();
const fmtPct = (n: number) => n.toFixed(1) + "%";

const PMDashboardPage = () => {
  const [entries, setEntries] = useState<ProductionManagerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToProductionLedger((data) => { setEntries(data); setLoading(false); });
    return () => unsub();
  }, []);

  const kpi = useMemo(() => {
    const te = entries.filter(e => e.date?.toDate()?.toDateString() === todayStr());
    const totalGood = entries.reduce((s, e) => s + (e.goodIngots || e.goodIngotsKg || 0), 0);
    const totalBad = entries.reduce((s, e) => s + (e.badIngotsKg || 0), 0);
    const avgEff = entries.length ? entries.reduce((s, e) => s + (e.efficiencyPercentage || 0), 0) / entries.length : 0;
    const pending = entries.filter(e => !e.reviewStatus || e.reviewStatus === "Pending").length;
    const approvedToday = te.filter(e => e.reviewStatus === "Reviewed" || e.reviewStatus === "Approved").length;
    const rejectedToday = te.filter(e => e.reviewStatus === "Returned").length;
    const totalWeight = entries.reduce((s, e) => s + (e.totalInputKg || e.totalInput || 0), 0);
    return { todayHeats: te.length, totalGood, totalBad, avgEff, pending, approvedToday, rejectedToday, totalWeight };
  }, [entries]);

  const productionByDay = useMemo(() => {
    const map: Record<string, { date: string; goodKg: number; badKg: number }> = {};
    entries.forEach(e => {
      const d = e.date?.toDate()?.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) || "?";
      if (!map[d]) map[d] = { date: d, goodKg: 0, badKg: 0 };
      map[d].goodKg += e.goodIngots || e.goodIngotsKg || 0;
      map[d].badKg += e.badIngotsKg || 0;
    });
    return Object.values(map).slice(-14).reverse();
  }, [entries]);

  const efficiencyTrend = useMemo(() =>
    entries.slice(0, 20).map(e => ({ heat: e.heatNo, eff: e.efficiencyPercentage || 0 })).reverse(),
    [entries]);

  const alloyDist = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { const a = e.alloyType || "Unknown"; map[a] = (map[a] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => { const s = e.reviewStatus || "Pending"; map[s] = (map[s] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [entries]);

  const materialUsage = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => e.materials?.forEach(m => { map[m.materialName] = (map[m.materialName] || 0) + m.weightKg; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, kg]) => ({ name, kg: Math.round(kg) }));
  }, [entries]);

  const KPI_CARDS = [
    { label: "Today's Heats", value: fmtNum(kpi.todayHeats), icon: <CalendarDays size={22} />, color: "#1565C0", bg: "#eff6ff" },
    { label: "Total Good Ingots", value: fmtNum(Math.round(kpi.totalGood)) + " kg", icon: <ThumbsUp size={22} />, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Total Bad Ingots", value: fmtNum(Math.round(kpi.totalBad)) + " kg", icon: <ThumbsDown size={22} />, color: "#dc2626", bg: "#fff1f2" },
    { label: "Avg Efficiency", value: fmtPct(kpi.avgEff), icon: <Zap size={22} />, color: "#d97706", bg: "#fffbeb" },
    { label: "Pending Reviews", value: fmtNum(kpi.pending), icon: <Clock size={22} />, color: "#f97316", bg: "#fff7ed" },
    { label: "Approved Today", value: fmtNum(kpi.approvedToday), icon: <CheckCircle2 size={22} />, color: "#059669", bg: "#ecfdf5" },
    { label: "Rejected Today", value: fmtNum(kpi.rejectedToday), icon: <XCircle size={22} />, color: "#dc2626", bg: "#fff1f2" },
    { label: "Total Prod. Weight", value: fmtNum(Math.round(kpi.totalWeight)) + " kg", icon: <Weight size={22} />, color: "#7c3aed", bg: "#f5f3ff" },
  ];

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
      <CircularProgress sx={{ color: BLUE }} />
    </Box>
  );

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ p: 1, bgcolor: "#eff6ff", borderRadius: 2 }}><Factory size={22} color={BLUE} /></Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>Production Dashboard</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>Real-time production monitoring</Typography>
        </Box>
        <Box sx={{ ml: "auto" }}>
          <Chip label="🔴 LIVE" size="small" sx={{ bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: "0.65rem" }} />
        </Box>
      </Box>

      {/* KPI Cards - 4 per row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 2, mb: 3 }}>
        {KPI_CARDS.map(card => (
          <Card key={card.label} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, "&:hover": { boxShadow: "0 4px 20px rgba(0,0,0,0.08)", transform: "translateY(-2px)" }, transition: "all 0.2s" }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography sx={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, mb: 0.5 }}>{card.label}</Typography>
                  <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: card.bg, borderRadius: 2, color: card.color }}>{card.icon}</Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Charts Row 1: 2/3 + 1/3 */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2.5, mb: 2.5 }}>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2, color: "#1e293b" }}>Production by Day</Typography>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={productionByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="goodKg" name="Good (kg)" fill="#16a34a" radius={[3, 3, 0, 0]} />
              <Bar dataKey="badKg" name="Bad (kg)" fill="#dc2626" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2, color: "#1e293b" }}>Heat Status Distribution</Typography>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                {statusDist.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#94a3b8"} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Box>

      {/* Charts Row 2: 1/2 + 1/2 */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5, mb: 2.5 }}>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2, color: "#1e293b" }}>Efficiency Trend</Typography>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={efficiencyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="heat" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} formatter={(v: any) => `${v}%`} />
              <Line type="monotone" dataKey="eff" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3 }} name="Efficiency %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2, color: "#1e293b" }}>Alloy Production Distribution</Typography>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie data={alloyDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }: any) => (percent || 0) > 0.05 ? `${name} ${((percent || 0) * 100).toFixed(0)}%` : ""}>
                {alloyDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </Box>

      {/* Charts Row 3: 7/12 + 5/12 */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.4fr 1fr" }, gap: 2.5 }}>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2, color: "#1e293b" }}>Most Used Materials (kg)</Typography>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={materialUsage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="kg" fill={BLUE} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2, color: "#1e293b" }}>Good vs Bad Ingots</Typography>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={productionByDay.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="goodKg" stroke="#16a34a" fill="#dcfce7" name="Good (kg)" strokeWidth={2} />
              <Area type="monotone" dataKey="badKg" stroke="#dc2626" fill="#fee2e2" name="Bad (kg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </Box>
    </Box>
  );
};

export default PMDashboardPage;
