import { useState, useRef } from "react";
import { makeEntityStore } from "@/lib/localStore";
import SubscriptionCard from "@/components/SubscriptionCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Trash2, AlertTriangle, CheckCircle2, Loader2, FileJson, FileSpreadsheet, Server, UserX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const RiskStore = makeEntityStore("Risk");

export default function Settings() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importMode, setImportMode] = useState("replace"); // replace | merge
  const fileRef = useRef();
  const csvFileRef = useRef();

  const handleExport = async () => {
    setExporting(true);
    const risks = await RiskStore.list("-created_date", 999);
    const json = JSON.stringify(risks, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riskshield_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: `Exported ${risks.length} risk${risks.length !== 1 ? "s" : ""}` });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    const risks = await RiskStore.list("-created_date", 999);
    
    // Define CSV headers
    const headers = [
      "risk_id", "title", "description", "category", "risk_owner",
      "inherent_likelihood", "inherent_consequence", "residual_likelihood", "residual_consequence",
      "existing_controls", "treatment_action", "treatment_option", "treatment_owner",
      "target_date", "review_date", "status", "notes"
    ];
    
    // Convert risks to CSV rows
    const rows = risks.map(r => [
      r.risk_id || "",
      `"${(r.title || "").replace(/"/g, '""')}"`,
      `"${(r.description || "").replace(/"/g, '""')}"`,
      r.category || "",
      r.risk_owner || "",
      r.inherent_likelihood || "",
      r.inherent_consequence || "",
      r.residual_likelihood || "",
      r.residual_consequence || "",
      `"${(r.existing_controls || "").replace(/"/g, '""')}"`,
      `"${(r.treatment_action || "").replace(/"/g, '""')}"`,
      r.treatment_option || "",
      r.treatment_owner || "",
      r.target_date || "",
      r.review_date || "",
      r.status || "",
      `"${(r.notes || "").replace(/"/g, '""')}"`
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `riskshield_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
    toast({ title: `Exported ${risks.length} risk${risks.length !== 1 ? "s" : ""} to CSV` });
  };

  const parseCSV = (text) => {
    const lines = text.split("\n").filter(l => l.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim());
    const rows = [];
    
    let i = 1;
    while (i < lines.length) {
      const cells = [];
      let cell = "";
      let inQuotes = false;
      const line = lines[i];
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          cells.push(cell.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
          cell = "";
        } else {
          cell += char;
        }
      }
      cells.push(cell.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
      
      if (cells.length === headers.length) {
        const obj = {};
        headers.forEach((h, idx) => {
          if (cells[idx]) obj[h] = cells[idx];
        });
        if (obj.title) rows.push(obj);
      }
      i++;
    }
    return rows;
  };

  const handleCSVFileSelect = async (file) => {
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const risks = parseCSV(text);
    
    if (!risks.length) {
      toast({ title: "No valid risks found", description: "CSV must have a header row and at least one risk." });
      setImporting(false);
      return;
    }

    setImportPreview({ 
      risks: risks.map((r, i) => ({
        ...r,
        risk_id: r.risk_id || `R-CSV-${String(i + 1).padStart(3, "0")}`,
        inherent_likelihood: Math.min(5, Math.max(1, Number(r.inherent_likelihood) || 3)),
        inherent_consequence: Math.min(5, Math.max(1, Number(r.inherent_consequence) || 3)),
        residual_likelihood: r.residual_likelihood ? Math.min(5, Math.max(1, Number(r.residual_likelihood))) : undefined,
        residual_consequence: r.residual_consequence ? Math.min(5, Math.max(1, Number(r.residual_consequence))) : undefined,
        status: r.status || "Identified",
      })),
      fileName: file.name,
      isCSV: true
    });
    setImporting(false);
  };

  const handleFileSelect = async (file) => {
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      toast({ title: "Invalid JSON file", description: "Please upload a valid RiskShield backup file." });
      setImporting(false);
      return;
    }

    if (!Array.isArray(data)) {
      toast({ title: "Invalid format", description: "File must contain an array of risks." });
      setImporting(false);
      return;
    }

    setImportPreview({ risks: data, fileName: file.name });
    setImporting(false);
  };

  const handleImport = async () => {
    if (!importPreview) return;
    const toImport = importPreview.risks.filter(r => r.title && r.category); // Basic validation

    if (importMode === "replace") {
      // Clear all existing risks
      const existing = await RiskStore.list("-created_date", 999);
      for (const r of existing) {
        await RiskStore.delete(r.id);
      }
    }

    // Import new risks
    await RiskStore.bulkCreate(toImport);
    toast({ title: `Imported ${toImport.length} risk${toImport.length !== 1 ? "s" : ""}` });
    setImportPreview(null);
    fileRef.current.value = "";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-display text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your RiskShield data and backups</p>
      </div>

      <div className="grid gap-5">
        {/* Subscription & Billing */}
        <SubscriptionCard />

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-600" />
              Export Risk Register
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Download your entire risk register as a JSON file. You can use this to backup your data or transfer it to another device.
            </p>
            <Button onClick={handleExport} disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? "Exporting..." : "Export as JSON"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-600" />
              Import Risk Register
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a previously exported JSON or CSV file to restore or import your risks.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all"
                onClick={() => fileRef.current?.click()}>
                <FileJson className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">JSON Backup</p>
                <p className="text-xs text-muted-foreground mt-1">.json files</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={e => handleFileSelect(e.target.files?.[0])}
                  disabled={importing}
                />
              </div>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all"
                onClick={() => csvFileRef.current?.click()}>
                <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">CSV Import</p>
                <p className="text-xs text-muted-foreground mt-1">.csv files</p>
                <input
                  ref={csvFileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => handleCSVFileSelect(e.target.files?.[0])}
                  disabled={importing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Export CSV Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export to CSV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Export your risk register as a CSV file for use in spreadsheets or external tools.
            </p>
            <Button onClick={handleExportCSV} disabled={exporting} className="gap-2">
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {exporting ? "Exporting..." : "Export as CSV"}
            </Button>
          </CardContent>
        </Card>

        {/* Import Preview Dialog */}
        {importPreview && (
          <Dialog open={!!importPreview} onOpenChange={() => setImportPreview(null)}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {importPreview.isCSV ? <FileSpreadsheet className="w-5 h-5" /> : <FileJson className="w-5 h-5" />}
                  Import Preview
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Found <span className="font-semibold">{importPreview.risks.length} risks</span> in {importPreview.fileName}
                  </p>
                </div>

                {importPreview.isCSV && (
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">ID</th>
                          <th className="px-3 py-2 text-left font-semibold">Title</th>
                          <th className="px-3 py-2 text-left font-semibold">Category</th>
                          <th className="px-3 py-2 text-left font-semibold">L/C</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {importPreview.risks.slice(0, 10).map((r, i) => (
                          <tr key={i} className="hover:bg-muted/50">
                            <td className="px-3 py-2">{r.risk_id}</td>
                            <td className="px-3 py-2 truncate">{r.title}</td>
                            <td className="px-3 py-2">{r.category}</td>
                            <td className="px-3 py-2">{r.inherent_likelihood}/{r.inherent_consequence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Import Mode</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setImportMode("replace")}
                      className={`flex-1 p-3 rounded-lg border transition-all ${importMode === "replace"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                        }`}
                    >
                      <p className="text-sm font-medium text-foreground">Replace All</p>
                      <p className="text-xs text-muted-foreground mt-1">Clear existing risks first</p>
                    </button>
                    <button
                      onClick={() => setImportMode("merge")}
                      className={`flex-1 p-3 rounded-lg border transition-all ${importMode === "merge"
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted/50"
                        }`}
                    >
                      <p className="text-sm font-medium text-foreground">Merge</p>
                      <p className="text-xs text-muted-foreground mt-1">Keep existing risks</p>
                    </button>
                  </div>
                </div>

                {importMode === "replace" && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      This will delete all your current risks. You cannot undo this action.
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="outline" onClick={() => setImportPreview(null)}>Cancel</Button>
                  <Button onClick={handleImport} className={importMode === "replace" ? "bg-destructive hover:bg-destructive/90" : ""}>
                    Import {importPreview.risks.length} Risk{importPreview.risks.length !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-600" />
              Self-Hosted Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deploy RiskShield on your own infrastructure using Docker. View the full installation guide for setup instructions, system requirements, and configuration options.
            </p>
            <Link to="/installation">
              <Button variant="outline" className="gap-2">
                <Server className="w-4 h-4" />
                View Installation Guide
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Delete All Risk Data</p>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently delete all risks and register data. This action cannot be undone.
              </p>
              <ClearAllButton />
            </div>
            <div className="border-t border-destructive/20 pt-4">
              <p className="text-sm font-medium text-foreground mb-1">Delete Account</p>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently delete your account and all associated data. You will be logged out immediately and cannot recover your account.
              </p>
              <DeleteAccountButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Cancel any active subscription first
      try { await base44.functions.invoke("cancelSubscription", {}); } catch {}
      // Delete the account
      await base44.auth.deleteAccount?.();
    } catch {
      // fallback: just log out
    } finally {
      base44.auth.logout("/");
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="gap-2"
        style={{ WebkitUserSelect: "none", userSelect: "none" }}
      >
        <UserX className="w-4 h-4" />
        Delete My Account
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, cancel your subscription, and remove all your data. You cannot recover your account after this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Keep Account</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Yes, Delete Account"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ClearAllButton() {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cleared, setCleared] = useState(false);

  const handleClear = async () => {
    const risks = await RiskStore.list("-created_date", 999);
    for (const r of risks) {
      await RiskStore.delete(r.id);
    }
    setConfirmOpen(false);
    setCleared(true);
    toast({ title: `Deleted ${risks.length} risk${risks.length !== 1 ? "s" : ""}` });
    setTimeout(() => setCleared(false), 3000);
  };

  if (cleared) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm">All data cleared</span>
      </div>
    );
  }

  return (
    <>
      <Button variant="destructive" onClick={() => setConfirmOpen(true)}>Delete All Risks</Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all risks?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your entire risk register. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClear} className="bg-destructive hover:bg-destructive/90">Delete Everything</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}