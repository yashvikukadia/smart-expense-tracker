import { NextRequest, NextResponse } from "next/server";
import { classifyExpense, classifyExpenseWithConfidence } from "@/lib/classifier";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const category = classifyExpense(text);
  const suggestions = classifyExpenseWithConfidence(text);

  return NextResponse.json({ category, suggestions });
}
