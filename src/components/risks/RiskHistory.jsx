import React, { useState, useEffect } from "react";
import { makeEntityStore } from "@/lib/localStore";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

const RiskAuditLogStore = makeEntityStore("RiskAuditLog");

export default function RiskHistory({ riskId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    loadHistory();
  }, [riskId]);

  const loadHistory = async () => {
    setLoading(true);
    const data = await RiskAuditLogStore.filter({ risk_id: riskId }, "-created_date", 100);
    setLogs(data);
    setLoading(false);
  };

  const toggleExpanded = (logId) => {
    setExpanded(prev => ({ ...prev, [logId]: !prev[logId] }));
  };

  const actionIcons = {
    created: "✨",
    updated: "✏️",
    deleted: "🗑️"
  };

  const actionColors = {
    created: "bg-green-100 text-green-800",
    updated: "bg-blue-100 text-blue-800",
    deleted: "bg-red-100 text-red-800"
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading history...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No changes recorded yet</div>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <Card key={log.id} className="overflow-hidden">
          <button
            onClick={() => toggleExpanded(log.id)}
            className="w-full text-left hover:bg-muted/50 transition-colors"
          >
            <CardHeader className="pb-3 cursor-pointer">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-lg">{actionIcons[log.action]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={actionColors[log.action]}>
                        {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                      </Badge>
                      <span className="text-sm font-medium text-foreground">
                        {log.changed_by_name || log.changed_by}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(parseISO(log.created_date), "PPpp")}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground flex-shrink-0">
                  {expanded[log.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
            </CardHeader>
          </button>

          {expanded[log.id] && (
            <CardContent className="pt-0 border-t">
              {log.changes && log.changes.length > 0 ? (
                <div className="space-y-2">
                  {log.changes.map((change, idx) => (
                    <div key={idx} className="text-sm space-y-1 py-2 border-b last:border-b-0">
                      <p className="font-medium text-foreground">{change.field}</p>
                      {change.old_value && (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-red-600">− </span>
                          {change.old_value}
                        </p>
                      )}
                      {change.new_value && (
                        <p className="text-xs text-muted-foreground">
                          <span className="text-green-600">+ </span>
                          {change.new_value}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No detailed changes recorded</p>
              )}
              {log.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-foreground mb-1">Notes:</p>
                  <p className="text-sm text-muted-foreground">{log.notes}</p>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}