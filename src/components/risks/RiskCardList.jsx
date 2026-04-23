import { AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/risks/RiskBadge";
import { getRiskRating, isExtremeRisk } from "@/lib/riskUtils";
import { format, parseISO } from "date-fns";

const statusStyles = {
  "Closed": "bg-emerald-100 text-emerald-800",
  "Being Treated": "bg-blue-100 text-blue-800",
  "Monitored": "bg-purple-100 text-purple-800",
  "Identified": "bg-gray-100 text-gray-700",
};

export default function RiskCardList({ risks, canEdit, canDelete, onEdit, onDelete }) {
  if (risks.length === 0) return (
    <div className="text-center py-12 text-muted-foreground text-sm">
      No risks found.{" "}
      {canEdit && (
        <button className="text-primary underline" onClick={() => onEdit(null)}>Add one now.</button>
      )}
    </div>
  );

  return (
    <div className="space-y-3">
      {risks.map(r => {
        const extreme = isExtremeRisk(r.inherent_likelihood, r.inherent_consequence);
        return (
          <div
            key={r.id}
            className={`rounded-xl border bg-card shadow-sm p-4 space-y-3 ${extreme ? "border-red-400 bg-red-50" : "border-border"}`}
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                {extreme && <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                <div className="min-w-0">
                  {r.risk_id && <p className="text-xs font-mono text-muted-foreground">{r.risk_id}</p>}
                  <p className="font-semibold text-foreground text-sm leading-snug">{r.title}</p>
                  {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(r)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                )}
                {canDelete && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(r)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs">{r.category}</Badge>
              {r.status && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[r.status] || statusStyles["Identified"]}`}>
                  {r.status}
                </span>
              )}
            </div>

            {/* Risk scores */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Inherent</p>
                <RiskBadge likelihood={r.inherent_likelihood} consequence={r.inherent_consequence} />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Residual</p>
                <RiskBadge likelihood={r.residual_likelihood} consequence={r.residual_consequence} />
              </div>
            </div>

            {/* Footer meta */}
            {(r.risk_owner || r.review_date) && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                {r.risk_owner && <span>Owner: {r.risk_owner}</span>}
                {r.review_date && <span>Review: {format(parseISO(r.review_date), "dd MMM yyyy")}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}