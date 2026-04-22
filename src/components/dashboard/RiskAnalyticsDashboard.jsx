import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CATEGORY_COLORS = {
  Financial: "#3b82f6",
  "Legal & Compliance": "#8b5cf6",
  Operational: "#ec4899",
  "WHS & Physical": "#f97316",
  Reputational: "#eab308",
  Strategic: "#06b6d4",
  Market: "#14b8a6",
  Technology: "#6366f1",
  Environmental: "#22c55e",
  "People & HR": "#f43f5e"
};

const STATUS_COLORS = {
  Identified: "#fbbf24",
  "Being Treated": "#3b82f6",
  Monitored: "#10b981",
  Closed: "#6b7280"
};

const RISK_LEVEL_COLORS = {
  "Extreme": "#dc2626",
  "High": "#f97316",
  "Medium": "#eab308",
  "Low": "#22c55e"
};

export default function RiskAnalyticsDashboard({ risks = [] }) {
  const analytics = useMemo(() => {
    if (!risks.length) return { byCategory: [], byStatus: [], byRiskLevel: [] };

    // Category distribution
    const categoryMap = {};
    risks.forEach(r => {
      const cat = r.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const byCategory = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Status distribution
    const statusMap = {};
    risks.forEach(r => {
      const status = r.status || "Identified";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    // Risk level distribution (based on inherent rating)
    const getRiskLevel = (likelihood, consequence) => {
      const score = likelihood * consequence;
      if (score >= 16) return "Extreme";
      if (score >= 9) return "High";
      if (score >= 4) return "Medium";
      return "Low";
    };

    const levelMap = {};
    risks.forEach(r => {
      const level = getRiskLevel(r.inherent_likelihood || 3, r.inherent_consequence || 3);
      levelMap[level] = (levelMap[level] || 0) + 1;
    });
    const byRiskLevel = Object.entries(levelMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => ["Extreme", "High", "Medium", "Low"].indexOf(a.name) - ["Extreme", "High", "Medium", "Low"].indexOf(b.name));

    return { byCategory, byStatus, byRiskLevel };
  }, [risks]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risks by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                  {analytics.byCategory.map((entry, idx) => (
                    <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || "#6366f1"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Risk Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} (${value})`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.byStatus.map((entry, idx) => (
                    <Cell key={idx} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Risk Level Heatmap */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Risk Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.byRiskLevel.length > 0 ? (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.byRiskLevel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                    {analytics.byRiskLevel.map((entry, idx) => (
                      <Cell key={idx} fill={RISK_LEVEL_COLORS[entry.name] || "#6b7280"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                {Object.entries(RISK_LEVEL_COLORS).map(([level, color]) => (
                  <div key={level} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                    <span className="text-sm text-foreground">{level}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}