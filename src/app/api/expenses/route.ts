import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyExpense } from "@/lib/classifier";
import { z } from "zod";

const createExpenseSchema = z.object({
  title: z.string().min(1).max(200),
  amount: z.number().positive(),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const category = searchParams.get("category");
  const month = searchParams.get("month"); // format: "2024-01"

  const where: Record<string, unknown> = { userId: session.user.id };
  if (category && category !== "all") where.category = category;
  if (month) {
    const [year, mon] = month.split("-").map(Number);
    where.date = {
      gte: new Date(year, mon - 1, 1),
      lt: new Date(year, mon, 1),
    };
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.expense.count({ where }),
  ]);

  return NextResponse.json({ expenses, total });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { title, amount, description, date } = parsed.data;
  // Auto-classify if no category provided
  const category = parsed.data.category || classifyExpense(title + " " + (description || ""));

  const expense = await prisma.expense.create({
    data: {
      title,
      amount,
      category,
      description,
      date: date ? new Date(date) : new Date(),
      userId: session.user.id,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}
