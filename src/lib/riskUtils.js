// AS/NZS 4360 / ISO 31000 Risk Scales

export const LIKELIHOOD_LABELS = {
  1: "Rare",
  2: "Unlikely",
  3: "Possible",
  4: "Likely",
  5: "Almost Certain"
};

export const CONSEQUENCE_LABELS = {
  1: "Insignificant",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Catastrophic"
};

export const LIKELIHOOD_DESC = {
  1: "May occur only in exceptional circumstances (< once in 10 years)",
  2: "Could occur at some time (once in 3–10 years)",
  3: "Might occur at some time (once in 1–3 years)",
  4: "Will probably occur in most circumstances (once per year)",
  5: "Expected to occur in most circumstances (multiple times per year)"
};

export const CONSEQUENCE_DESC = {
  1: "No injuries, low financial loss, minimal impact",
  2: "First aid treatment, medium financial loss, some disruption",
  3: "Medical treatment required, high financial loss, significant disruption",
  4: "Extensive injuries, major financial loss, serious regulatory impact",
  5: "Death or permanent disability, massive financial loss, business failure"
};

export const RISK_MATRIX = [
  // [likelihood][consequence] → rating
  [null,  "Low",    "Low",    "Low",     "Medium",  "Medium"],
  [null,  "Low",    "Low",    "Medium",  "Medium",  "High"],
  [null,  "Low",    "Medium", "Medium",  "High",    "High"],
  [null,  "Medium", "Medium", "High",    "High",    "Extreme"],
  [null,  "Medium", "High",   "High",    "Extreme", "Extreme"],
  [null,  "High",   "High",   "Extreme", "Extreme", "Extreme"],
];

export function getRiskRating(likelihood, consequence) {
  if (!likelihood || !consequence) return null;
  return RISK_MATRIX[likelihood]?.[consequence] ?? null;
}

export function getRiskScore(likelihood, consequence) {
  return (likelihood || 0) * (consequence || 0);
}

export const RISK_COLORS = {
  Low: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300", hex: "#22c55e", cell: "#d1fae5" },
  Medium: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", hex: "#f59e0b", cell: "#fef3c7" },
  High: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", hex: "#f97316", cell: "#ffedd5" },
  Extreme: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", hex: "#ef4444", cell: "#fee2e2" },
};

export const CATEGORY_COLORS = {
  "Financial": "#3b82f6",
  "Legal & Compliance": "#8b5cf6",
  "Operational": "#06b6d4",
  "WHS & Physical": "#f97316",
  "Reputational": "#ec4899",
  "Strategic": "#6366f1",
  "Market": "#14b8a6",
  "Technology": "#84cc16",
  "Environmental": "#22c55e",
  "People & HR": "#f59e0b",
};

export const TREATMENT_OPTIONS = ["Avoid", "Reduce", "Transfer", "Accept"];
export const RISK_STATUSES = ["Identified", "Being Treated", "Monitored", "Closed"];
export const RISK_CATEGORIES = [
  "Financial", "Legal & Compliance", "Operational", "WHS & Physical",
  "Reputational", "Strategic", "Market", "Technology", "Environmental", "People & HR"
];