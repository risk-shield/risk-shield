import { useState } from "react";
import { LIKELIHOOD_LABELS, CONSEQUENCE_LABELS, RISK_MATRIX, RISK_COLORS, getRiskRating } from "@/lib/riskUtils";
import { cn } from "@/lib/utils";

const CELL_MATRIX = [
  // consequence → 1,2,3,4,5  (rows = likelihood 5→1)
  ["Low","Low","Medium","Medium","High"],      // L=1
  ["Low","Low","Medium","High","High"],        // L=2
  ["Low","Medium","Medium","High","High"],     // L=3
  ["Medium","Medium","High","High","Extreme"], // L=4
  ["Medium","High","High","Extreme","Extreme"],// L=5
];

// Rows rendered top→bottom as L=5 down to L=1
const LIKELIHOOD_ORDER = [5,4,3,2,1];

export default function InteractiveRiskMatrix({ risks = [], onRiskClick, title = "Risk Matrix", showType = "inherent" }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const getRisksInCell = (l, c) =>
    risks.filter(r => {
      const lk = showType === "residual" ? r.residual_likelihood : r.inherent_likelihood;
      const cn2 = showType === "residual" ? r.residual_consequence : r.inherent_consequence;
      return lk === l && cn2 === c;
    });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-3">
          {["Low","Medium","High","Extreme"].map(r => (
            <div key={r} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: RISK_COLORS[r].hex }} />
              <span className="text-xs text-muted-foreground">{r}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {/* Y-axis label */}
        <div className="flex items-center justify-center w-6">
          <span className="text-xs text-muted-foreground font-medium -rotate-90 whitespace-nowrap">← Likelihood →</span>
        </div>

        <div className="flex-1">
          {/* Y-axis labels + grid */}
          <div className="flex gap-1">
            <div className="flex flex-col gap-1 w-24 justify-around" style={{ paddingTop: '0px' }}>
              {LIKELIHOOD_ORDER.map(l => (
                <div key={l} className="flex items-center justify-end pr-2 h-12">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-foreground">{LIKELIHOOD_LABELS[l]}</div>
                    <div className="text-xs text-muted-foreground">({l})</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Matrix cells */}
            <div className="flex-1">
              <div className="flex flex-col gap-1">
                {LIKELIHOOD_ORDER.map((l, li) => (
                  <div key={l} className="flex gap-1">
                    {[1,2,3,4,5].map((c, ci) => {
                      const rating = CELL_MATRIX[l - 1][c - 1];
                      const cellRisks = getRisksInCell(l, c);
                      const isHovered = hoveredCell?.l === l && hoveredCell?.c === c;

                      return (
                        <div
                          key={c}
                          className={cn(
                            "flex-1 h-12 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all duration-150 relative",
                            isHovered ? "scale-105 shadow-lg z-10 border-primary" : "border-transparent"
                          )}
                          style={{ backgroundColor: RISK_COLORS[rating]?.cell }}
                          onMouseEnter={() => setHoveredCell({ l, c })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => cellRisks.length > 0 && onRiskClick && onRiskClick(cellRisks)}
                        >
                          {cellRisks.length > 0 ? (
                            <div className="flex flex-wrap gap-0.5 p-0.5 items-center justify-center">
                              {cellRisks.slice(0, 4).map(r => (
                                <div
                                  key={r.id}
                                  className="w-5 h-5 rounded-full bg-white/80 border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 hover:scale-110 transition-transform shadow-sm"
                                  title={r.title}
                                  onClick={e => { e.stopPropagation(); onRiskClick && onRiskClick([r]); }}
                                >
                                  {(r.risk_id || r.title)?.[0] || "R"}
                                </div>
                              ))}
                              {cellRisks.length > 4 && (
                                <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-bold">
                                  +{cellRisks.length - 4}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs font-medium opacity-40" style={{ color: RISK_COLORS[rating]?.hex }}>
                              {l}×{c}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="flex gap-1 mt-2">
                {[1,2,3,4,5].map(c => (
                  <div key={c} className="flex-1 text-center">
                    <div className="text-xs font-semibold text-foreground">{CONSEQUENCE_LABELS[c]}</div>
                    <div className="text-xs text-muted-foreground">({c})</div>
                  </div>
                ))}
              </div>
              <div className="text-center mt-1">
                <span className="text-xs text-muted-foreground font-medium">← Consequence →</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}