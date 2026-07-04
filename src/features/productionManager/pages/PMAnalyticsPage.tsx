import { useEffect, useState, useMemo } from "react";
import {
  Box, Card, Typography, Grid, CircularProgress, Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import { subscribeToProductionLedger } from "../services/productionManager.service";
import type { ProductionManagerEntry } from "../types/productionManager.types";

const BLUE = "#1565C0";
const PIE_COLORS = ["#1565C0", "#0288d1", "#26a69a", "#f57c00", "#e53935", "#8e24aa", "#00897b", "#e91e63"];

const fmtMonth = (ts: any) => {
  if (!ts) return "?";
  try { return ts.toDate().toLocaleDateString("en-IN", { month: "short", year: "2-digit" }); } catch { return "?"; }
};
const fmtWeek = (ts: any) => {
  if (!ts) return "?";
  try {
    const d = ts.toDate();
    const week = Math.ceil(d.getDate() / 7);
    return `W${week} ${d.toLocaleDateString("en-IN", { month: "short" })}`;
  } catch { return "?"; }
};

const PMAnalyticsPage = () => {
  const [entries, setEntries] = useState<ProductionManagerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");

  useEffect(() => {
    const unsub = subscribeToProductionLedger((data) => { setEntries(data); setLoading(false); });
    return () => unsub();
  }, []);

  // Production trend grouped by month/week
  const productionTrend = useMemo(() => {
    const map: Record<string, { period: string; heats: number; goodKg: number; badKg: number; eff: number; count: number }> = {};
    entries.forEach((e) => {
      const k = period === "monthly" ? fmtMonth(e.date) : fmtWeek(e.date);
      if (!map[k]) map[k] = { period: k, heats: 0, goodKg: 0, badKg: 0, eff: 0, count: 0 };
      map[k].heats++;
      map[k].goodKg += e.goodIngotsKg || e.goodIngots || 0;
      map[k].badKg += e.badIngotsKg || 0;
      map[k].eff += e.efficiencyPercentage || 0;
      map[k].count++;
    });
    return Object.values(map).map((v) => ({ ...v, avgEff: v.count ? +(v.eff / v.count).toFixed(1) : 0, goodKg: +v.goodKg.toFixed(1), badKg: +v.badKg.toFixed(1) })).slice(-12);
  }, [entries, period]);

  const alloyProd = useMemo(() => {
    const map: Record<string, { name: string; heats: number; goodKg: number }> = {};
    entries.forEach((e) => {
      const a = e.alloyType || "Unknown";
      if (!map[a]) map[a] = { name: a, heats: 0, goodKg: 0 };
      map[a].heats++;
      map[a].goodKg += e.goodIngotsKg || e.goodIngots || 0;
    });
    return Object.values(map).sort((a, b) => b.goodKg - a.goodKg);
  }, [entries]);

  const materialConsumption = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach((e) => e.materials?.forEach((m) => { map[m.materialName] = (map[m.materialName] || 0) + m.weightKg; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, kg]) => ({ name, kg: +kg.toFixed(1) }));
  }, [entries]);

  // Top supervisor
  const supervisorPerf = useMemo(() => {
    const map: Record<string, { name: string; heats: number; totalEff: number }> = {};
    entries.forEach((e) => {
      const s = e.supervisorName || "Unknown";
      if (!map[s]) map[s] = { name: s, heats: 0, totalEff: 0 };
      map[s].heats++;
      map[s].totalEff += e.efficiencyPercentage || 0;
    });
    return Object.values(map).map((v) => ({ ...v, avgEff: +(v.totalEff / v.heats).toFixed(1) })).sort((a, b) => b.avgEff - a.avgEff).slice(0, 8);
  }, [entries]);

  // Top shift
  const shiftPerf = useMemo(() => {
    const map: Record<string, { shift: string; heats: number; totalEff: number }> = {};
    entries.forEach((e) => {
      const s = e.shiftStartTime ? `${e.shiftStartTime} ${e.shiftStartPeriod}` : "Unknown";
      if (!map[s]) map[s] = { shift: s, heats: 0, totalEff: 0 };
      map[s].heats++;
      map[s].totalEff += e.efficiencyPercentage || 0;
    });
    return Object.values(map).map((v) => ({ ...v, avgEff: +(v.totalEff / v.heats).toFixed(1) })).sort((a, b) => b.avgEff - a.avgEff).slice(0, 6);
  }, [entries]);

  const avgEff = entries.length ? (entries.reduce((s, e) => s + (e.efficiencyPercentage || 0), 0) / entries.length).toFixed(1) : "0";

  if (loading) return (
    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress sx={{ color: BLUE }} /></Box>
  );

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ p: 1, bgcolor: "#eff6ff", borderRadius: 2 }}><BarChart3 size={22} color={BLUE} /></Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a" }}>Analytics</Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b" }}>Production performance analysis</Typography>
        </Box>
        <Box sx={{ ml: "auto" }}>
          <FormControl size="small">
            <InputLabel>Period</InputLabel>
            <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value as any)} sx={{ minWidth: 120 }}>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Summary KPI Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Total Heats", value: entries.length },
          { label: "Avg Efficiency", value: avgEff + "%" },
          { label: "Total Good (kg)", value: entries.reduce((s, e) => s + (e.goodIngotsKg || e.goodIngots || 0), 0).toFixed(0) },
          { label: "Total Bad (kg)", value: entries.reduce((s, e) => s + (e.badIngotsKg || 0), 0).toFixed(0) },
        ].map((k) => (
          <Grid item xs={6} md={3} key={k.label}>
            <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2, textAlign: "center" }}>
              <Typography sx={{ fontSize: "1.5rem", fontWeight: 800, color: BLUE }}>{k.value}</Typography>
              <Typography sx={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>{k.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Production Trend */}
      <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Production Trend — Good vs Bad Ingots</Typography>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={productionTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="goodKg" stroke="#16a34a" fill="#dcfce7" name="Good (kg)" strokeWidth={2} />
            <Area type="monotone" dataKey="badKg" stroke="#dc2626" fill="#fee2e2" name="Bad (kg)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* Efficiency Trend */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Average Efficiency Trend</Typography>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={productionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => v + "%"} />
                <Line type="monotone" dataKey="avgEff" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3 }} name="Avg Efficiency" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Heat Count Trend */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Heat Count per Period</Typography>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={productionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="heats" fill={BLUE} radius={[4, 4, 0, 0]} name="Heats" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {/* Production by Alloy */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Production by Alloy (Good kg)</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={alloyProd} dataKey="goodKg" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ""}>
                  {alloyProd.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Material Consumption */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Material Consumption (kg)</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={materialConsumption} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="kg" fill="#0288d1" radius={[0, 4, 4, 0]} name="Consumption (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Top Supervisor */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Top Performing Supervisors</Typography>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={supervisorPerf} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => v + "%"} />
                <Bar dataKey="avgEff" fill="#16a34a" radius={[0, 4, 4, 0]} name="Avg Efficiency" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Top Shift */}
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, p: 2.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 2 }}>Top Performing Shifts</Typography>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={shiftPerf}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="shift" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => v + "%"} />
                <Bar dataKey="avgEff" fill="#f57c00" radius={[4, 4, 0, 0]} name="Avg Efficiency" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PMAnalyticsPage;
