"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { CATEGORY_COLORS, CATEGORY_ICONS, ExpenseCategory } from "@/lib/classifier";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Analytics {
  summary: {
    totalAllTime: number;
    totalCount: number;
    thisMonth: number;
    lastMonth: number;
    changePercent: number;
  };
  categoryBreakdown: Array<{ category: string; total: number; count: number }>;
  monthlyTrend: Array<{ month: string; total: number }>;
  recentExpenses: Array<{ id: string; title: string; amount: number; category: string; date: string }>;
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px" }}>
        <p style={{ color: "var(--text-secondary)", fontSize: "12px", marginBottom: "4px" }}>{label}</p>
        <p style={{ fontWeight: "700", fontSize: "15px" }}>{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: "28px" }}>
          <div className="shimmer" style={{ height: "28px", width: "160px", marginBottom: "8px" }} />
          <div className="shimmer" style={{ height: "16px", width: "220px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: "300px", borderRadius: "16px" }} />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const trendData = data.monthlyTrend.map((t) => {
    const [year, mon] = t.month.split("-");
    return { name: MONTHS_SHORT[parseInt(mon) - 1] + " '" + year.slice(2), total: t.total };
  });

  const barData = data.categoryBreakdown.map((c) => ({
    name: (CATEGORY_ICONS[c.category as ExpenseCategory] || "📦") + " " + c.category.split(" ")[0],
    fullName: c.category,
    total: c.total,
    count: c.count,
    color: CATEGORY_COLORS[c.category as ExpenseCategory] || "#6b7280",
  }));

  const pieData = data.categoryBreakdown.map((c) => ({
    name: c.category,
    value: c.total,
    color: CATEGORY_COLORS[c.category as ExpenseCategory] || "#6b7280",
  }));

  const { summary } = data;
  const change = summary.changePercent;
  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>Analytics</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Deep insights into your spending patterns</p>
      </div>

      {/* Month Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>This Month</div>
          <div style={{ fontSize: "24px", fontWeight: "700" }}>{formatCurrency(summary.thisMonth)}</div>
        </div>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>Last Month</div>
          <div style={{ fontSize: "24px", fontWeight: "700" }}>{formatCurrency(summary.lastMonth)}</div>
        </div>
        <div className="glass-card" style={{ padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>Month-over-Month</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: isUp ? "#f87171" : isDown ? "#10b981" : "var(--text-primary)" }}>
              {isUp ? "+" : ""}{change}%
            </div>
            {isUp ? <TrendingUp size={20} color="#f87171" /> : isDown ? <TrendingDown size={20} color="#10b981" /> : <Minus size={20} color="var(--text-muted)" />}
          </div>
          <div style={{ fontSize: "12px", color: isUp ? "#f87171" : isDown ? "#10b981" : "var(--text-muted)", marginTop: "4px" }}>
            {isUp ? "Spending increased" : isDown ? "Spending decreased" : "No change"} vs last month
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Line Chart - Trend */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>Monthly Spending Trend</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>6-month overview</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: "#555570", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555570", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2.5} dot={{ r: 4, fill: "#7c3aed" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut - Categories */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>Category Distribution</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>This month's breakdown</p>
          {pieData.length > 0 ? (
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0ff" }}
                    formatter={(v: number) => [formatCurrency(v)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                {pieData.slice(0, 6).map((c) => {
                  const pct = summary.thisMonth > 0 ? Math.round((c.value / summary.thisMonth) * 100) : 0;
                  return (
                    <div key={c.name}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                        <span style={{ color: "var(--text-secondary)" }}>{(CATEGORY_ICONS[c.name as ExpenseCategory] || "📦")} {c.name.split(" ")[0]}</span>
                        <span style={{ fontWeight: "600" }}>{pct}%</span>
                      </div>
                      <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: c.color, borderRadius: "2px", transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>No data this month</div>
          )}
        </div>
      </div>

      {/* Bar Chart - Full Width */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>Spending by Category</h2>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "20px" }}>Top categories this month</p>
        {barData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#555570", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555570", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0ff" }}
                formatter={(v: number, _: string, props: { payload: { fullName: string; count: number } }) => [
                  formatCurrency(v),
                  `${props.payload.fullName} (${props.payload.count} transactions)`,
                ]}
              />
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>No category data this month</div>
        )}
      </div>

      {/* Category Cards */}
      {data.categoryBreakdown.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "16px" }}>Category Breakdown</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {data.categoryBreakdown.map((c) => {
              const color = CATEGORY_COLORS[c.category as ExpenseCategory] || "#6b7280";
              const icon = CATEGORY_ICONS[c.category as ExpenseCategory] || "📦";
              const pct = summary.thisMonth > 0 ? Math.round((c.total / summary.thisMonth) * 100) : 0;
              return (
                <div key={c.category} className="stat-card" style={{ cursor: "default" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                      {icon}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>{c.category}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{c.count} transactions</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>{formatCurrency(c.total)}</div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{pct}% of total</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
