import { useState, useEffect } from "react";
import { makeEntityStore } from "@/lib/localStore";

const RiskStore = makeEntityStore("Risk");
import { Link } from "react-router-dom";
import { getRiskRating, RISK_COLORS, CATEGORY_COLORS, RISK_CATEGORIES } from "@/lib/riskUtils";
import { Shield, TrendingDown, AlertTriangle, CheckCircle2, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RiskBadge from "@/components/risks/RiskBadge";
import InteractiveRiskMatrix from "@/components/risks/InteractiveRiskMatrix";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, isAfter, parseISO } from "date-fns";

export default function Dashboard() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    RiskStore.list("-created_date", 200).then(r => {
      setRisks(r);
      setLoading(false);
    });
  }, []);

  const ratingOf = r => getRiskRating(r.inherent_likelihood, r.inherent_consequence);
  const residualRatingOf = r => getRiskRating(r.residual_likelihood, r.residual_consequence);

  const counts = {
    Extreme: risks.filter(r => ratingOf(r) === "Extreme").length,
    High: risks.filter(r => ratingOf(r) === "High").length,
    Medium: risks.filter(r => ratingOf(r) === "Medium").length,
    Low: risks.filter(r => ratingOf(r) === "Low").length,
  };

  const statusCounts = {
    Identified: risks.filter(r => r.status === "Identified").length,
    "Being Treated": risks.filter(r => r.status === "Being Treated").length,
    Monitored: risks.filter(r => r.status === "Monitored").length,
    Closed: risks.filter(r => r.status === "Closed").length,
  };

  const overdueRisks = risks.filter(r =>
    r.target_date && r.status !== "Closed" && isAfter(new Date(), parseISO(r.target_date))
  );

  const categoryData = RISK_CATEGORIES
    .map(cat => ({ name: cat, count: risks.filter(r => r.category === cat).length }))
    .filter(d => d.count > 0)
    .sort((a, b) => b.count - a.count);

  const ratingPieData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: RISK_COLORS[name].hex }));

  const recentRisks = [...risks].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 5);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display text-foreground">Risk Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Aligned with AS ISO 31000:2018 · AS/NZS 4360</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Extreme Risks", count: counts.Extreme, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
          { label: "High Risks", count: counts.High, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
          { label: "Medium Risks", count: counts.Medium, icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "Low Risks", count: counts.Low, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <Card key={label} className={`border ${bg}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                <p className="text-3xl font-bold text-foreground">{count}</p>
              </div>
              <Icon className={`w-8 h-8 ${color} opacity-70`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueRisks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">{overdueRisks.length} treatment action{overdueRisks.length > 1 ? "s" : ""} overdue</p>
              <p className="text-xs text-red-600">{overdueRisks.map(r => r.title).join(", ")}</p>
            </div>
            <Link to="/treatments" className="ml-auto">
              <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                View <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Inherent Risk Position</CardTitle>
              <Link to="/matrix">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                  Full View <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <InteractiveRiskMatrix risks={risks} showType="inherent" />
          </CardContent>
        </Card>

        {/* Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {ratingPieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={ratingPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {ratingPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v, n]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {ratingPieData.map(d => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                        <span className="text-sm text-foreground">{d.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Shield className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No risks yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risks by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryData.map((d, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[d.name] || "#6366f1"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Recent risks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Risks</CardTitle>
              <Link to="/register"><Button variant="ghost" size="sm" className="text-xs text-muted-foreground">View All <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentRisks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <Shield className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No risks recorded yet</p>
                <Link to="/register" className="mt-2"><Button size="sm">Add First Risk</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRisks.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.risk_id && <span className="text-muted-foreground mr-1">{r.risk_id}</span>}{r.title}</p>
                      <p className="text-xs text-muted-foreground">{r.category}</p>
                    </div>
                    <RiskBadge likelihood={r.inherent_likelihood} consequence={r.inherent_consequence} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}