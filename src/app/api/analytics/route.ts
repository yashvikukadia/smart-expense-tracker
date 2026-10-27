import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalExpenses,
    thisMonthExpenses,
    lastMonthExpenses,
    categoryBreakdown,
    monthlyTrend,
    recentExpenses,
  ] = await Promise.all([
    // Total all time
    prisma.expense.aggregate({
      where: { userId },
      _sum: { amount: true },
      _count: true,
    }),
    // This month
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    // Last month
    prisma.expense.aggregate({
      where: {
        userId,
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
    // Category breakdown (this month)
    prisma.expense.groupBy({
      by: ["category"],
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: "desc" } },
    }),
    // Monthly trend - last 6 months raw data
    prisma.expense.findMany({
      where: {
        userId,
        date: {
          gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
        },
      },
      select: { amount: true, date: true, category: true },
      orderBy: { date: "asc" },
    }),
    // Recent 5 expenses
    prisma.expense.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  // Process monthly trend into grouped buckets
  const trendMap: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMap[key] = 0;
  }
  for (const e of monthlyTrend) {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in trendMap) trendMap[key] += e.amount;
  }

  const trend = Object.entries(trendMap).map(([month, total]) => ({
    month,
    total: Math.round(total * 100) / 100,
  }));

  const thisMonth = thisMonthExpenses._sum.amount || 0;
  const lastMonth = lastMonthExpenses._sum.amount || 0;
  const changePercent =
    lastMonth === 0
      ? 100
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

  return NextResponse.json({
    summary: {
      totalAllTime: totalExpenses._sum.amount || 0,
      totalCount: totalExpenses._count,
      thisMonth,
      lastMonth,
      changePercent,
    },
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c.category,
      total: c._sum.amount || 0,
      count: c._count,
    })),
    monthlyTrend: trend,
    recentExpenses,
  });
}
