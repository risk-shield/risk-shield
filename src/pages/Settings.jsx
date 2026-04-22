import { useState, useRef } from "react";
import { makeEntityStore } from "@/lib/localStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Trash2, AlertTriangle, CheckCircle2, Loader2, FileJson } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const RiskStore = makeEntityStore("Risk");

export default function Settings() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [importMode, setImportMode] = useState("replace"); // replace | merge
  const fileRef = useRef();

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
              Upload a previously exported JSON backup file to restore your risks.
            </p>
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all"
              onClick={() => fileRef.current?.click()}>
              <FileJson className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Click to browse or drag file here</p>
              <p className="text-xs text-muted-foreground mt-1">.json backup files</p>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={e => handleFileSelect(e.target.files?.[0])}
                disabled={importing}
              />
            </div>
          </CardContent>
        </Card>

        {/* Import Preview Dialog */}
        {importPreview && (
          <Dialog open={!!importPreview} onOpenChange={() => setImportPreview(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5" />
                  Import Preview
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Found <span className="font-semibold">{importPreview.risks.length} risks</span> in {importPreview.fileName}
                  </p>
                </div>

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

        {/* Danger Zone */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete all risks and data. This action cannot be undone.
            </p>
            <ClearAllButton />
          </CardContent>
        </Card>
      </div>
    </div>
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