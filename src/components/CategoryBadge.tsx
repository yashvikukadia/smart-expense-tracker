import { CATEGORY_COLORS, CATEGORY_ICONS, ExpenseCategory } from "@/lib/classifier";

interface CategoryBadgeProps {
  category: string;
  size?: "sm" | "md";
}

export default function CategoryBadge({ category, size = "md" }: CategoryBadgeProps) {
  const cat = category as ExpenseCategory;
  const color = CATEGORY_COLORS[cat] || "#6b7280";
  const icon = CATEGORY_ICONS[cat] || "📦";

  return (
    <span
      className="badge"
      style={{
        background: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
        fontSize: size === "sm" ? "10px" : "11px",
        padding: size === "sm" ? "2px 8px" : "3px 10px",
      }}
    >
      <span style={{ fontSize: size === "sm" ? "10px" : "12px" }}>{icon}</span>
      {category}
    </span>
  );
}
