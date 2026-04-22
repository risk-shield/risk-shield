import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getRiskRating, LIKELIHOOD_LABELS, CONSEQUENCE_LABELS, LIKELIHOOD_DESC, CONSEQUENCE_DESC } from "@/lib/riskUtils";
import InteractiveRiskMatrix from "@/components/risks/InteractiveRiskMatrix";
import RiskBadge from "@/components/risks/RiskBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RefreshCw, Info, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RiskMatrix() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("inherent");
  const [selectedRisks, setSelectedRisks] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    base44.entities.Risk.list("-created_date", 500).then(r => {
      setRisks(r);
      setLoading(false);
    });
  }, []);

  const handleCellClick = (cellRisks) => {
    setSelectedRisks(cellRisks);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Risk Matrix</h1>
          <p className="text-sm text-muted-foreground mt-0.5">5×5 AS/NZS 4360 · Click a cell to view risks</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowLegend(true)} className="gap-2">
            <Info className="w-4 h-4" /> Scale Reference
          </Button>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="inherent">Inherent</TabsTrigger>
              <TabsTrigger value="residual">Residual</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main matrix */}
        <Card className="xl:col-span-2">
          <CardContent className="p-6">
            <InteractiveRiskMatrix
              risks={risks}
              showType={view}
              title={view === "inherent" ? "Inherent Risk Position (Before Controls)" : "Residual Risk Position (After Controls)"}
              onRiskClick={handleCellClick}
            />
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Movement comparison */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                Risk Movement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">Inherent → Residual rating change</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {risks.filter(r => r.inherent_likelihood && r.residual_likelihood).map(r => {
                  const iRating = getRiskRating(r.inherent_likelihood, r.inherent_consequence);
                  const rRating = getRiskRating(r.residual_likelihood, r.residual_consequence);
                  const improved = ["Extreme","High","Medium","Low"].indexOf(rRating) > ["Extreme","High","Medium","Low"].indexOf(iRating);
                  return (
                    <div key={r.id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">{r.title}</p>
                      </div>
                      <RiskBadge label={iRating} />
                      <span className={`text-xs ${improved ? "text-emerald-600" : "text-muted-foreground"}`}>→</span>
                      <RiskBadge label={rRating} />
                    </div>
                  );
                })}
                {risks.filter(r => r.inherent_likelihood && r.residual_likelihood).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Add residual risk ratings to see movement</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected cell */}
          {selectedRisks && (
            <Card className="border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Selected Cell — {selectedRisks.length} risk{selectedRisks.length !== 1 ? "s" : ""}</CardTitle>
                  <button onClick={() => setSelectedRisks(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedRisks.map(r => (
                    <div key={r.id} className="p-3 rounded-lg bg-muted/40 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                        <RiskBadge likelihood={r.inherent_likelihood} consequence={r.inherent_consequence} />
                      </div>
                      {r.category && <Badge variant="outline" className="text-xs">{r.category}</Badge>}
                      {r.risk_owner && <p className="text-xs text-muted-foreground">Owner: {r.risk_owner}</p>}
                      {r.treatment_action && <p className="text-xs text-muted-foreground line-clamp-2">{r.treatment_action}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Scale reference sheet */}
      <Sheet open={showLegend} onOpenChange={setShowLegend}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display">AS/NZS 4360 Scale Reference</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Likelihood Scale</h3>
              <div className="space-y-2">
                {[5,4,3,2,1].map(l => (
                  <div key={l} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">{l}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{LIKELIHOOD_LABELS[l]}</p>
                      <p className="text-xs text-muted-foreground">{LIKELIHOOD_DESC[l]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Consequence Scale</h3>
              <div className="space-y-2">
                {[5,4,3,2,1].map(c => (
                  <div key={c} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">{c}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{CONSEQUENCE_LABELS[c]}</p>
                      <p className="text-xs text-muted-foreground">{CONSEQUENCE_DESC[c]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Treatment Options (ISO 31000)</h3>
              {[
                { name: "Avoid", desc: "Eliminate the risk by not undertaking the activity" },
                { name: "Reduce", desc: "Reduce likelihood and/or consequence through controls" },
                { name: "Transfer", desc: "Share or transfer to a third party (insurance, contracts)" },
                { name: "Accept", desc: "Accept the risk with documented rationale and monitoring" },
              ].map(t => (
                <div key={t.name} className="flex gap-3 p-3 rounded-lg bg-muted/40 mb-2">
                  <p className="text-sm font-semibold text-foreground w-16 flex-shrink-0">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}