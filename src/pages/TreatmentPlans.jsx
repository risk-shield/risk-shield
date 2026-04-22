import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getRiskRating, RISK_COLORS, RISK_CATEGORIES, TREATMENT_OPTIONS } from "@/lib/riskUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RiskBadge from "@/components/risks/RiskBadge";
import { RefreshCw, Calendar, User, CheckCircle2, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

const STATUS_STYLES = {
  "Identified": "bg-gray-100 text-gray-700",
  "Being Treated": "bg-blue-100 text-blue-800",
  "Monitored": "bg-purple-100 text-purple-800",
  "Closed": "bg-emerald-100 text-emerald-800",
};

const TREATMENT_STYLES = {
  "Avoid": "bg-red-100 text-red-800 border-red-200",
  "Reduce": "bg-amber-100 text-amber-800 border-amber-200",
  "Transfer": "bg-blue-100 text-blue-800 border-blue-200",
  "Accept": "bg-gray-100 text-gray-700 border-gray-200",
};

function TreatmentCard({ risk, onStatusChange }) {
  const iRating = getRiskRating(risk.inherent_likelihood, risk.inherent_consequence);
  const rRating = getRiskRating(risk.residual_likelihood, risk.residual_consequence);

  const isOverdue = risk.target_date && risk.status !== "Closed" && isAfter(new Date(), parseISO(risk.target_date));
  const isDueSoon = risk.target_date && risk.status !== "Closed" && !isOverdue &&
    isBefore(parseISO(risk.target_date), addDays(new Date(), 14));

  return (
    <Card className={`border transition-shadow hover:shadow-md ${isOverdue ? "border-red-300 bg-red-50/30" : isDueSoon ? "border-amber-300 bg-amber-50/30" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start gap-2 justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {risk.risk_id && <span className="text-xs font-mono text-muted-foreground">{risk.risk_id}</span>}
              <Badge variant="outline" className="text-xs">{risk.category}</Badge>
              {risk.treatment_option && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${TREATMENT_STYLES[risk.treatment_option] || "bg-muted text-muted-foreground border-border"}`}>
                  {risk.treatment_option}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-foreground text-sm leading-snug">{risk.title}</h3>
          </div>
          <Select value={risk.status} onValueChange={v => onStatusChange(risk.id, v)}>
            <SelectTrigger className="w-36 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Identified","Being Treated","Monitored","Closed"].map(s => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Risk ratings */}
        <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Inherent</p>
            <RiskBadge label={iRating} />
            {iRating && <p className="text-xs text-muted-foreground mt-0.5">{risk.inherent_likelihood}×{risk.inherent_consequence}</p>}
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Residual</p>
            {rRating ? <RiskBadge label={rRating} /> : <span className="text-xs text-muted-foreground italic">Not set</span>}
            {rRating && <p className="text-xs text-muted-foreground mt-0.5">{risk.residual_likelihood}×{risk.residual_consequence}</p>}
          </div>
        </div>

        {/* Existing controls */}
        {risk.existing_controls && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Existing Controls</p>
            <p className="text-sm text-foreground leading-relaxed">{risk.existing_controls}</p>
          </div>
        )}

        {/* Treatment actions */}
        {risk.treatment_action && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Treatment Actions</p>
            <p className="text-sm text-foreground leading-relaxed">{risk.treatment_action}</p>
          </div>
        )}

        {/* Notes */}
        {risk.notes && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{risk.notes}</p>
          </div>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
          {risk.treatment_owner && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>{risk.treatment_owner}</span>
            </div>
          )}
          {risk.target_date && (
            <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? "text-red-600 font-semibold" : isDueSoon ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
              {isOverdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
              <span>Target: {format(parseISO(risk.target_date), "dd MMM yyyy")}</span>
              {isOverdue && <span className="text-xs">(OVERDUE)</span>}
              {isDueSoon && !isOverdue && <span className="text-xs">(due soon)</span>}
            </div>
          )}
          {risk.review_date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>Review: {format(parseISO(risk.review_date), "dd MMM yyyy")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TreatmentPlans() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [filterTreatment, setFilterTreatment] = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Risk.list("-created_date", 500);
    setRisks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (id, status) => {
    await base44.entities.Risk.update(id, { status });
    setRisks(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const ratingOrder = { "Extreme": 0, "High": 1, "Medium": 2, "Low": 3, null: 4 };

  const filtered = risks
    .filter(r => {
      const matchTab = tab === "all" || r.status === tab ||
        (tab === "overdue" && r.target_date && r.status !== "Closed" && isAfter(new Date(), parseISO(r.target_date)));
      const matchCat = filterCat === "all" || r.category === filterCat;
      const matchTreatment = filterTreatment === "all" || r.treatment_option === filterTreatment;
      return matchTab && matchCat && matchTreatment;
    })
    .sort((a, b) => {
      const ra = getRiskRating(a.inherent_likelihood, a.inherent_consequence);
      const rb = getRiskRating(b.inherent_likelihood, b.inherent_consequence);
      return (ratingOrder[ra] ?? 4) - (ratingOrder[rb] ?? 4);
    });

  const overdueCount = risks.filter(r =>
    r.target_date && r.status !== "Closed" && isAfter(new Date(), parseISO(r.target_date))
  ).length;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display text-foreground">Treatment Plans</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Risk mitigation actions — prioritised by inherent risk rating</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">All ({risks.length})</TabsTrigger>
            <TabsTrigger value="Identified">Identified</TabsTrigger>
            <TabsTrigger value="Being Treated">In Progress</TabsTrigger>
            <TabsTrigger value="Monitored">Monitored</TabsTrigger>
            <TabsTrigger value="Closed">Closed</TabsTrigger>
            {overdueCount > 0 && (
              <TabsTrigger value="overdue" className="text-red-600">Overdue ({overdueCount})</TabsTrigger>
            )}
          </TabsList>
        </Tabs>

        <div className="flex gap-2 ml-auto">
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {RISK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterTreatment} onValueChange={setFilterTreatment}>
            <SelectTrigger className="w-36 h-9 text-xs"><SelectValue placeholder="Treatment" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Treatments</SelectItem>
              {TREATMENT_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Risks", value: risks.length, icon: CheckCircle2, color: "text-primary" },
          { label: "Being Treated", value: risks.filter(r => r.status === "Being Treated").length, icon: RefreshCw, color: "text-blue-600" },
          { label: "Overdue", value: overdueCount, icon: AlertTriangle, color: overdueCount > 0 ? "text-red-600" : "text-muted-foreground" },
          { label: "Closed", value: risks.filter(r => r.status === "Closed").length, icon: CheckCircle2, color: "text-emerald-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
            <div>
              <p className="text-xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <CheckCircle2 className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No treatment plans to show</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(r => (
            <TreatmentCard key={r.id} risk={r} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}