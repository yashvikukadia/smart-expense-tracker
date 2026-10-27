// ============================================================
// ML Classification Engine — Rule-based keyword matching
// Classifies expense descriptions into spending categories
// ============================================================

export type ExpenseCategory =
  | "Food & Dining"
  | "Shopping"
  | "Travel"
  | "Health & Medical"
  | "Entertainment"
  | "Bills & Utilities"
  | "Education"
  | "Personal Care"
  | "Others";

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  "Food & Dining": "#f97316",
  Shopping: "#8b5cf6",
  Travel: "#06b6d4",
  "Health & Medical": "#10b981",
  Entertainment: "#ec4899",
  "Bills & Utilities": "#f59e0b",
  Education: "#3b82f6",
  "Personal Care": "#a78bfa",
  Others: "#6b7280",
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  "Food & Dining": "🍕",
  Shopping: "🛍️",
  Travel: "✈️",
  "Health & Medical": "🏥",
  Entertainment: "🎬",
  "Bills & Utilities": "💡",
  Education: "📚",
  "Personal Care": "💆",
  Others: "📦",
};

const KEYWORD_MAP: Record<ExpenseCategory, string[]> = {
  "Food & Dining": [
    "restaurant", "pizza", "burger", "grocery", "groceries", "lunch", "dinner",
    "breakfast", "cafe", "coffee", "tea", "food", "snack", "meal", "eat",
    "swiggy", "zomato", "dominos", "mcdonalds", "kfc", "subway", "hotel",
    "bakery", "juice", "milk", "vegetable", "fruit", "meat", "fish", "chicken",
    "rice", "bread", "cookie", "cake", "dessert", "ice cream", "bar", "pub",
    "biryani", "dosa", "idli", "paratha", "thali", "dhaba", "canteen",
  ],
  Shopping: [
    "amazon", "flipkart", "myntra", "shopping", "clothes", "clothing", "shirt",
    "pants", "shoes", "dress", "fashion", "mall", "store", "purchase", "buy",
    "online", "meesho", "ajio", "jacket", "jeans", "saree", "kurta", "bag",
    "wallet", "watch", "accessory", "electronics", "phone", "laptop", "tablet",
    "gift", "toy", "furniture", "decor", "ikea", "croma", "reliance digital",
  ],
  Travel: [
    "flight", "hotel", "uber", "ola", "taxi", "train", "bus", "airbnb",
    "booking", "trip", "travel", "airport", "metro", "auto", "fuel",
    "petrol", "diesel", "tolls", "parking", "irctc", "makemytrip", "goibibo",
    "rapido", "bike", "cab", "railway", "ticket", "visa", "passport",
    "holiday", "vacation", "tour", "resort", "hostel",
  ],
  "Health & Medical": [
    "doctor", "hospital", "pharmacy", "medicine", "medical", "clinic",
    "gym", "fitness", "health", "yoga", "vitamin", "supplement", "test",
    "lab", "scan", "consultation", "dentist", "eye", "optician", "surgery",
    "apollo", "practo", "1mg", "pharmeasy", "netmeds", "cult", "protein",
  ],
  Entertainment: [
    "netflix", "amazon prime", "hotstar", "disney", "spotify", "youtube",
    "movie", "cinema", "theater", "game", "gaming", "concert", "show",
    "event", "ticket", "fun", "party", "club", "ps5", "xbox", "steam",
    "music", "streaming", "subscription", "book", "comedy", "sport",
    "cricket", "football", "match", "ipl", "pvr", "inox",
  ],
  "Bills & Utilities": [
    "electricity", "electric", "water", "internet", "wifi", "broadband",
    "phone", "mobile", "recharge", "rent", "maintenance", "gas", "lpg",
    "insurance", "emi", "loan", "credit card", "bill", "utility",
    "jio", "airtel", "vi", "bsnl", "postpaid", "prepaid", "dth",
    "society", "housekeeping", "plumber", "electrician",
  ],
  Education: [
    "course", "udemy", "coursera", "tuition", "school", "college",
    "university", "books", "stationery", "pen", "notebook", "fees",
    "exam", "certification", "training", "workshop", "seminar",
    "coaching", "institute", "library", "subscription learning",
  ],
  "Personal Care": [
    "salon", "haircut", "spa", "beauty", "cosmetics", "makeup",
    "skincare", "shampoo", "soap", "toothpaste", "grooming", "nails",
    "waxing", "facial", "massage", "parlour", "nykaa", "purplle",
    "perfume", "deodorant", "lotion", "cream",
  ],
  Others: [],
};

/**
 * Classifies an expense title/description into a spending category.
 * Uses token-based keyword scoring.
 *
 * @param text - The expense title or description
 * @returns The best-matching ExpenseCategory
 */
export function classifyExpense(text: string): ExpenseCategory {
  if (!text || text.trim().length === 0) return "Others";

  const normalized = text.toLowerCase().trim();
  const scores: Partial<Record<ExpenseCategory, number>> = {};

  for (const [category, keywords] of Object.entries(KEYWORD_MAP) as [
    ExpenseCategory,
    string[]
  ][]) {
    if (keywords.length === 0) continue;

    let score = 0;
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        // Longer keyword matches get higher scores (more specific)
        score += keyword.length;
      }
    }
    if (score > 0) {
      scores[category] = (scores[category] || 0) + score;
    }
  }

  if (Object.keys(scores).length === 0) return "Others";

  // Return the category with the highest score
  const best = Object.entries(scores).sort(([, a], [, b]) => b - a)[0];
  return best[0] as ExpenseCategory;
}

/**
 * Returns top 3 suggested categories with confidence scores
 */
export function classifyExpenseWithConfidence(
  text: string
): Array<{ category: ExpenseCategory; confidence: number }> {
  if (!text || text.trim().length === 0)
    return [{ category: "Others", confidence: 1 }];

  const normalized = text.toLowerCase().trim();
  const scores: Partial<Record<ExpenseCategory, number>> = {};

  for (const [category, keywords] of Object.entries(KEYWORD_MAP) as [
    ExpenseCategory,
    string[]
  ][]) {
    if (keywords.length === 0) continue;
    let score = 0;
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        score += keyword.length;
      }
    }
    if (score > 0) scores[category] = score;
  }

  if (Object.keys(scores).length === 0)
    return [{ category: "Others", confidence: 1 }];

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat, score]) => ({
      category: cat as ExpenseCategory,
      confidence: Math.round((score / total) * 100) / 100,
    }));
}

export const ALL_CATEGORIES: ExpenseCategory[] = [
  "Food & Dining",
  "Shopping",
  "Travel",
  "Health & Medical",
  "Entertainment",
  "Bills & Utilities",
  "Education",
  "Personal Care",
  "Others",
];
