import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search, PlusCircle, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const ACTION_STYLES = {
  created: { label: "Created", icon: PlusCircle, class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  updated: { label: "Updated", icon: Pencil,     class: "bg-blue-100 text-blue-800 border-blue-200" },
  deleted: { label: "Deleted", icon: Trash2,     class: "bg-red-100 text-red-800 border-red-200" },
};

function AuditEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const action = ACTION_STYLES[entry.action] || ACTION_STYLES.updated;
  const Icon = action.icon;
  const hasChanges = entry.changes?.length > 0;

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden">
      <div
        className={`flex items-center gap-3 p-4 ${hasChanges ? "cursor-pointer hover:bg-muted/30" : ""}`}
        onClick={() => hasChanges && setExpanded(e => !e)}
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate">{entry.risk_title || entry.risk_id}</span>
            <Badge className={`text-xs border ${action.class}`}>{action.label}</Badge>
            {entry.changes?.length > 0 && (
              <span className="text-xs text-muted-foreground">{entry.changes.length} field{entry.changes.length !== 1 ? "s" : ""} changed</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <span>{entry.changed_by_name || entry.changed_by}</span>
            <span>·</span>
            <span>{entry.created_date ? format(new Date(entry.created_date), "dd MMM yyyy, h:mm a") : "—"}</span>
          </div>
        </div>

        {hasChanges && (
          <div className="text-muted-foreground flex-shrink-0">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        )}
      </div>

      {expanded && hasChanges && (
        <div className="border-t border-border bg-muted/20 px-4 py-3">
          <div className="space-y-2">
            {entry.changes.map((change, i) => (
              <div key={i} className="grid grid-cols-[120px_1fr_1fr] gap-3 text-xs">
                <span className="font-medium text-foreground">{change.field}</span>
                <span className="text-muted-foreground line-through truncate">{change.old_value || "—"}</span>
                <span className="text-foreground font-medium truncate">{change.new_value || "—"}</span>
              </div>
            ))}
            <div className="grid grid-cols-[120px_1fr_1fr] gap-3 text-xs text-muted-foreground border-t border-border pt-2 mt-2">
              <span>Field</span><span>Previous value</span><span>New value</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    base44.entities.RiskAuditLog.list("-created_date", 200).then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filtered = logs.filter(l => {
    const matchSearch = !search ||
      l.risk_title?.toLowerCase().includes(search.toLowerCase()) ||
      l.changed_by_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.changed_by?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || l.action === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Risk Audit Log</h1>
          <p className="text-sm text-muted-foreground">Complete history of all risk changes</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by risk title or user…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No audit entries yet</p>
          <p className="text-sm mt-1">Changes to risks will appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}</p>
          {filtered.map(entry => <AuditEntry key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  );
}