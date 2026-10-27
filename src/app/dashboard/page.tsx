"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp, TrendingDown, DollarSign, Receipt,
  ArrowRight, Plus, Sparkles,
} from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { CATEGORY_COLORS, ExpenseCategory } from "@/lib/classifier";

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
  recentExpenses: Array<{
    id: string;
    title: string;
    amount: number;
    category: string;
    date: string;
  }>;
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  color: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: "500" }}>{label}</div>
        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: "26px", fontWeight: "700", marginBottom: "6px" }}>{value}</div>
      {subtext && (
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: trend === "up" ? "#f87171" : trend === "down" ? "#10b981" : "var(--text-muted)" }}>
          {trend === "up" ? <TrendingUp size={12} /> : trend === "down" ? <TrendingDown size={12} /> : null}
          {subtext}
        </div>
      )}
    </div>
  );
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const trendData = data?.monthlyTrend.map((t) => {
    const [year, mon] = t.month.split("-");
    return { name: MONTHS_SHORT[parseInt(mon) - 1] + " '" + year.slice(2), total: t.total };
  }) || [];

  const pieData = data?.categoryBreakdown.slice(0, 6) || [];

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: "28px" }}>
          <div className="shimmer" style={{ height: "28px", width: "220px", marginBottom: "8px" }} />
          <div className="shimmer" style={{ height: "16px", width: "160px" }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: "110px", borderRadius: "16px" }} />)}
        </div>
      </div>
    );
  }

  const { summary, recentExpenses } = data || { summary: { totalAllTime: 0, totalCount: 0, thisMonth: 0, lastMonth: 0, changePercent: 0 }, recentExpenses: [] };
  const isIncrease = summary.changePercent > 0;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: "700", marginBottom: "4px" }}>
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
            <span className="gradient-text">{session?.user?.name?.split(" ")[0]} 👋</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Here&apos;s your financial overview
          </p>
        </div>
        <Link href="/expenses" id="add-expense-btn">
          <button className="btn-primary">
            <Plus size={16} />
            Add Expense
          </button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <StatCard label="This Month" value={formatCurrency(summary.thisMonth)} subtext={`${isIncrease ? "+" : ""}${summary.changePercent}% vs last month`} icon={DollarSign} trend={isIncrease ? "up" : "down"} color="#7c3aed" />
        <StatCard label="Last Month" value={formatCurrency(summary.lastMonth)} icon={TrendingDown} color="#06b6d4" />
        <StatCard label="Total All Time" value={formatCurrency(summary.totalAllTime)} icon={TrendingUp} color="#10b981" />
        <StatCard label="Total Transactions" value={summary.totalCount.toString()} subtext="all time" icon={Receipt} color="#f97316" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", marginBottom: "24px" }}>
        {/* Area Chart */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "2px" }}>Spending Trend</h2>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Last 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: "#555570", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#555570", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0ff" }}
                formatter={(v: number) => [formatCurrency(v), "Total"]}
              />
              <Area type="monotone" dataKey="total" stroke="#7c3aed" strokeWidth={2.5} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h2 style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>By Category</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>This month</p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={pieData} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[entry.category as ExpenseCategory] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#f0f0ff" }}
                    formatter={(v: number) => [formatCurrency(v)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {pieData.slice(0, 4).map((c) => (
                  <div key={c.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: CATEGORY_COLORS[c.category as ExpenseCategory] || "#6b7280", flexShrink: 0 }} />
                      <span style={{ color: "var(--text-secondary)" }}>{c.category}</span>
                    </div>
                    <span style={{ fontWeight: "600" }}>{formatCurrency(c.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: "13px" }}>
              No expenses this month
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} color="#a78bfa" />
            <h2 style={{ fontSize: "15px", fontWeight: "600" }}>Recent Transactions</h2>
          </div>
          <Link href="/expenses" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#a78bfa", textDecoration: "none", fontWeight: "500" }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentExpenses.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentExpenses.map((e) => (
                <tr key={e.id}>
                  <td style={{ fontWeight: "500" }}>{e.title}</td>
                  <td><CategoryBadge category={e.category} size="sm" /></td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{formatDate(e.date)}</td>
                  <td style={{ textAlign: "right", fontWeight: "700", color: "#f97316" }}>{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <Receipt size={40} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-secondary)", fontSize: "15px", fontWeight: "500" }}>No expenses yet</p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>Add your first expense to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
