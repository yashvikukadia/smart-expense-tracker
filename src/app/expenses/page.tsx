"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus, Search, Filter, Pencil, Trash2, X, Loader2,
  Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import CategoryBadge from "@/components/CategoryBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ALL_CATEGORIES, ExpenseCategory } from "@/lib/classifier";

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
}

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, "Enter a valid amount"),
  category: z.string().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [autoCategory, setAutoCategory] = useState<string>("");
  const [classifying, setClassifying] = useState(false);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: new Date().toISOString().split("T")[0] },
  });

  const titleValue = watch("title");

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterCategory !== "all") params.set("category", filterCategory);
    const res = await fetch(`/api/expenses?${params}`);
    const data = await res.json();
    setExpenses(data.expenses || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [filterCategory]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  // Auto classify as user types
  useEffect(() => {
    if (!titleValue || titleValue.length < 3) { setAutoCategory(""); return; }
    const timer = setTimeout(async () => {
      setClassifying(true);
      const res = await fetch("/api/classify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: titleValue }) });
      const data = await res.json();
      setAutoCategory(data.category);
      setClassifying(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [titleValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    const payload = {
      title: data.title,
      amount: parseFloat(data.amount),
      category: data.category || autoCategory || undefined,
      description: data.description,
      date: data.date,
    };

    const url = editingId ? `/api/expenses/${editingId}` : "/api/expenses";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) {
      reset({ date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      setEditingId(null);
      setAutoCategory("");
      fetchExpenses();
    }
    setSubmitting(false);
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setValue("title", expense.title);
    setValue("amount", expense.amount.toString());
    setValue("category", expense.category);
    setValue("description", expense.description || "");
    setValue("date", new Date(expense.date).toISOString().split("T")[0]);
    setAutoCategory(expense.category);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setDeleteId(null);
    fetchExpenses();
  };

  const filtered = expenses
    .filter((e) => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortDir === "desc" ? new Date(b.date).getTime() - new Date(a.date).getTime() : new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "4px" }}>Expenses</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{total} total transactions</p>
        </div>
        <button id="open-add-form-btn" className="btn-primary" onClick={() => { setShowForm(!showForm); setEditingId(null); reset({ date: new Date().toISOString().split("T")[0] }); setAutoCategory(""); }}>
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass-card fade-in" style={{ padding: "24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600" }}>{editingId ? "Edit Expense" : "New Expense"}</h2>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              {/* Title */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Description *</label>
                <div style={{ position: "relative" }}>
                  <input {...register("title")} id="expense-title" placeholder="e.g. Lunch at McDonald's, Netflix subscription..." className="form-input" style={{ paddingRight: autoCategory ? "180px" : "12px" }} />
                  {(classifying || autoCategory) && (
                    <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {classifying ? (
                        <Loader2 size={14} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
                      ) : (
                        <>
                          <Sparkles size={12} color="#a78bfa" />
                          <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: "600" }}>AI: {autoCategory}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {errors.title && <p className="form-error">{errors.title.message}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="form-label">Amount (₹) *</label>
                <input {...register("amount")} id="expense-amount" type="number" step="0.01" placeholder="0.00" className="form-input" />
                {errors.amount && <p className="form-error">{errors.amount.message}</p>}
              </div>

              {/* Date */}
              <div>
                <label className="form-label">Date</label>
                <input {...register("date")} id="expense-date" type="date" className="form-input" style={{ colorScheme: "dark" }} />
              </div>

              {/* Category Override */}
              <div>
                <label className="form-label">
                  Category{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: "400" }}>(auto-detected)</span>
                </label>
                <select {...register("category")} id="expense-category" className="form-input" style={{ cursor: "pointer" }}>
                  <option value="">— Auto detect —</option>
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notes (optional)</label>
                <input {...register("description")} id="expense-notes" placeholder="Optional notes..." className="form-input" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" id="save-expense-btn" className="btn-primary" disabled={submitting}>
                {submitting ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving...</> : editingId ? "Update Expense" : "Add Expense"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input id="search-input" type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: "36px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={14} color="var(--text-muted)" />
          <select id="category-filter" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="form-input" style={{ width: "auto", cursor: "pointer", paddingRight: "32px" }}>
            <option value="all">All Categories</option>
            {ALL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="btn-secondary" onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px" }}>
          {sortDir === "desc" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          Date
        </button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1,2,3,4,5].map(i => <div key={i} className="shimmer" style={{ height: "44px", borderRadius: "8px" }} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <div style={{ fontWeight: "500" }}>{expense.title}</div>
                      {expense.description && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{expense.description}</div>}
                    </td>
                    <td><CategoryBadge category={expense.category} size="sm" /></td>
                    <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{formatDate(expense.date)}</td>
                    <td style={{ textAlign: "right", fontWeight: "700", color: "#f97316", fontSize: "15px" }}>{formatCurrency(expense.amount)}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button id={`edit-${expense.id}`} onClick={() => handleEdit(expense)} style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", color: "#a78bfa", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button id={`delete-${expense.id}`} onClick={() => setDeleteId(expense.id)} className="btn-danger" style={{ padding: "5px 10px", fontSize: "12px" }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>💸</div>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: "500" }}>
              {search || filterCategory !== "all" ? "No matching expenses found" : "No expenses yet"}
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
              {!search && filterCategory === "all" && "Click 'Add Expense' to record your first transaction"}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="glass-card" style={{ padding: "28px", maxWidth: "360px", width: "90%", background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: "17px", fontWeight: "700", marginBottom: "8px" }}>Delete Expense?</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button id="confirm-delete-btn" onClick={() => handleDelete(deleteId)} className="btn-danger" style={{ flex: 1, justifyContent: "center" }}>Delete</button>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
