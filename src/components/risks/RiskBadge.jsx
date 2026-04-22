import { getRiskRating, RISK_COLORS } from "@/lib/riskUtils";
import { cn } from "@/lib/utils";

export default function RiskBadge({ likelihood, consequence, label, size = "sm" }) {
  const rating = label || getRiskRating(likelihood, consequence);
  if (!rating) return null;
  const colors = RISK_COLORS[rating] || RISK_COLORS.Low;

  return (
    <span className={cn(
      "inline-flex items-center font-semibold rounded-full border",
      colors.bg, colors.text, colors.border,
      size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
    )}>
      {rating}
    </span>
  );
}