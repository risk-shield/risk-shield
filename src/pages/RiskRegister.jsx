import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { getRiskRating, RISK_COLORS, RISK_CATEGORIES, RISK_STATUSES } from "@/lib/riskUtils";
import { Plus, Search, Filter, Pencil, Trash2, ChevronDown, ChevronUp, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import RiskBadge from "@/components/risks/RiskBadge";
import RiskForm from "@/components/risks/RiskForm";
import { format, parseISO } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function RiskRegister() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [sortField, setSortField] = useState("created_date");
  const [sortDir, setSortDir] = useState("desc");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Risk.list("-created_date", 500);
    setRisks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = risks
    .filter(r => {
      const q = search.toLowerCase();
      const matchSearch = !q || r.title?.toLowerCase().includes(q) || r.risk_id?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q);
      const matchCat = filterCat === "all" || r.category === filterCat;
      const matchStatus = filterStatus === "all" || r.status === filterStatus;
      const rating = getRiskRating(r.inherent_likelihood, r.inherent_consequence);
      const matchRating = filterRating === "all" || rating === filterRating;
      return matchSearch && matchCat && matchStatus && matchRating;
    })
    .sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (sortField === "score") { va = (a.inherent_likelihood||0)*(a.inherent_consequence||0); vb = (b.inherent_likelihood||0)*(b.inherent_consequence||0); }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  const handleSave = async (form) => {
    setSaving(true);
    if (editing) {
      await base44.entities.Risk.update(editing.id, form);
      toast({ title: "Risk updated" });
    } else {
      await base44.entities.Risk.create(form);
      toast({ title: "Risk added" });
    }
    setSaving(false);
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this risk?")) return;
    await base44.entities.Risk.delete(id);
    toast({ title: "Risk deleted" });
    load();
  };

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const SortIcon = ({ field }) => sortField === field
    ? (sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : <ChevronDown className="w-3 h-3 opacity-30" />;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display text-foreground">Risk Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{risks.length} total risks · {filtered.length} shown</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Risk
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search risks..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {RISK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {RISK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {["Extreme","High","Medium","Low"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
        {(search || filterCat !== "all" || filterStatus !== "all" || filterRating !== "all") && (
          <Button variant="ghost" size="icon" onClick={() => { setSearch(""); setFilterCat("all"); setFilterStatus("all"); setFilterRating("all"); }}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {[
                    { label: "ID", field: "risk_id" },
                    { label: "Title", field: "title" },
                    { label: "Category", field: "category" },
                    { label: "Inherent Risk", field: "score" },
                    { label: "Residual Risk", field: null },
                    { label: "Status", field: "status" },
                    { label: "Owner", field: "risk_owner" },
                    { label: "Review", field: "review_date" },
                    { label: "", field: null },
                  ].map(col => (
                    <th key={col.label} className={`px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide ${col.field ? "cursor-pointer hover:text-foreground" : ""}`}
                      onClick={() => col.field && toggleSort(col.field)}>
                      <div className="flex items-center gap-1">{col.label}{col.field && <SortIcon field={col.field} />}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No risks found. <button className="text-primary underline" onClick={() => { setEditing(null); setShowForm(true); }}>Add one now.</button></td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.risk_id || "—"}</td>
                    <td className="px-4 py-3 max-w-48">
                      <p className="font-medium text-foreground truncate">{r.title}</p>
                      {r.description && <p className="text-xs text-muted-foreground truncate">{r.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{r.category}</Badge>
                    </td>
                    <td className="px-4 py-3"><RiskBadge likelihood={r.inherent_likelihood} consequence={r.inherent_consequence} /></td>
                    <td className="px-4 py-3"><RiskBadge likelihood={r.residual_likelihood} consequence={r.residual_consequence} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === "Closed" ? "bg-emerald-100 text-emerald-800" :
                        r.status === "Being Treated" ? "bg-blue-100 text-blue-800" :
                        r.status === "Monitored" ? "bg-purple-100 text-purple-800" :
                        "bg-gray-100 text-gray-700"
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{r.risk_owner || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {r.review_date ? format(parseISO(r.review_date), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(r); setShowForm(true); }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit Risk" : "Add New Risk"}</DialogTitle>
          </DialogHeader>
          <RiskForm
            initial={editing || {}}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}