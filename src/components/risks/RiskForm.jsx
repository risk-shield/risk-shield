import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LIKELIHOOD_LABELS, CONSEQUENCE_LABELS, RISK_CATEGORIES, TREATMENT_OPTIONS, RISK_STATUSES } from "@/lib/riskUtils";
import RiskBadge from "./RiskBadge";

const FIELDS = [
  { id: "risk_id", label: "Risk ID", type: "text", placeholder: "e.g. R-001" },
  { id: "title", label: "Risk Title *", type: "text", placeholder: "Short descriptive title" },
];

export default function RiskForm({ initial = {}, onSave, onCancel, loading }) {
  const [form, setForm] = useState({
    risk_id: "", title: "", description: "", category: "",
    risk_owner: "", inherent_likelihood: "", inherent_consequence: "",
    residual_likelihood: "", residual_consequence: "",
    existing_controls: "", treatment_action: "", treatment_option: "",
    treatment_owner: "", target_date: "", review_date: "",
    status: "Identified", notes: "",
    ...initial
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Risk Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Risk ID</Label>
            <Input value={form.risk_id} onChange={e => set("risk_id", e.target.value)} placeholder="R-001" />
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {RISK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Risk Title *</Label>
            <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Short descriptive title" required />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the risk in detail" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Risk Owner</Label>
            <Input value={form.risk_owner} onChange={e => set("risk_owner", e.target.value)} placeholder="Person responsible" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RISK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Inherent Risk */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Inherent Risk (Before Controls)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <Label>Likelihood</Label>
            <Select value={String(form.inherent_likelihood)} onValueChange={v => set("inherent_likelihood", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {LIKELIHOOD_LABELS[n]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Consequence</Label>
            <Select value={String(form.inherent_consequence)} onValueChange={v => set("inherent_consequence", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {CONSEQUENCE_LABELS[n]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <span className="text-sm text-muted-foreground">Rating:</span>
            <RiskBadge likelihood={form.inherent_likelihood} consequence={form.inherent_consequence} />
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Label>Existing Controls</Label>
          <Textarea value={form.existing_controls} onChange={e => set("existing_controls", e.target.value)} placeholder="Describe current controls in place" rows={2} />
        </div>
      </div>

      {/* Residual Risk */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Residual Risk (After Controls)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <Label>Likelihood</Label>
            <Select value={String(form.residual_likelihood)} onValueChange={v => set("residual_likelihood", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {LIKELIHOOD_LABELS[n]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Consequence</Label>
            <Select value={String(form.residual_consequence)} onValueChange={v => set("residual_consequence", Number(v))}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n} – {CONSEQUENCE_LABELS[n]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <span className="text-sm text-muted-foreground">Rating:</span>
            <RiskBadge likelihood={form.residual_likelihood} consequence={form.residual_consequence} />
          </div>
        </div>
      </div>

      {/* Treatment */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Treatment Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Treatment Option</Label>
            <Select value={form.treatment_option} onValueChange={v => set("treatment_option", v)}>
              <SelectTrigger><SelectValue placeholder="Avoid / Reduce / Transfer / Accept" /></SelectTrigger>
              <SelectContent>
                {TREATMENT_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Treatment Owner</Label>
            <Input value={form.treatment_owner} onChange={e => set("treatment_owner", e.target.value)} placeholder="Responsible person" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Treatment Actions</Label>
            <Textarea value={form.treatment_action} onChange={e => set("treatment_action", e.target.value)} placeholder="Describe the actions to treat this risk" rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Target Date</Label>
            <Input type="date" value={form.target_date} onChange={e => set("target_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Review Date</Label>
            <Input type="date" value={form.review_date} onChange={e => set("review_date", e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes or comments" rows={2} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Risk"}
        </Button>
      </div>
    </form>
  );
}