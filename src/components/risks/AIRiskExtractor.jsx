import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Sparkles, CheckCircle2, AlertTriangle, FileText, X, Loader2, Plus, Check } from "lucide-react";
import RiskBadge from "./RiskBadge";
import { getRiskRating, RISK_COLORS } from "@/lib/riskUtils";
import { useToast } from "@/components/ui/use-toast";

export default function AIRiskExtractor({ onRisksImported }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState("upload"); // upload | extracting | review | done
  const [extractedRisks, setExtractedRisks] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef();
  const { toast } = useToast();

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setStage("extracting");

    // Upload file first
    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    // Extract text content then ask LLM to identify risks
    const extracted = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          document_summary: { type: "string" },
          risks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                category: {
                  type: "string",
                  enum: ["Financial","Legal & Compliance","Operational","WHS & Physical","Reputational","Strategic","Market","Technology","Environmental","People & HR"]
                },
                inherent_likelihood: { type: "number", description: "1-5" },
                inherent_consequence: { type: "number", description: "1-5" },
                existing_controls: { type: "string" },
                treatment_action: { type: "string" },
                treatment_option: { type: "string", enum: ["Avoid","Reduce","Transfer","Accept"] }
              }
            }
          }
        }
      }
    });

    // If extraction worked, use it; otherwise fall back to LLM
    let risks = [];
    if (extracted.status === "success" && extracted.output?.risks?.length > 0) {
      risks = extracted.output.risks;
    } else {
      // Fetch raw text and use LLM
      const textRes = await fetch(file_url);
      const rawText = await textRes.text();

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a risk management expert aligned with AS ISO 31000:2018 and AS/NZS 4360.
        
Analyse the following document and extract all business risks mentioned or implied. 
For each risk provide:
- title (concise, max 10 words)
- description (2-3 sentences)  
- category (one of: Financial, Legal & Compliance, Operational, WHS & Physical, Reputational, Strategic, Market, Technology, Environmental, People & HR)
- inherent_likelihood (1=Rare, 2=Unlikely, 3=Possible, 4=Likely, 5=Almost Certain)
- inherent_consequence (1=Insignificant, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic)
- existing_controls (if mentioned in document)
- treatment_action (recommended treatment)
- treatment_option (Avoid, Reduce, Transfer, or Accept)

Document content:
${rawText.slice(0, 8000)}`,
        response_json_schema: {
          type: "object",
          properties: {
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  inherent_likelihood: { type: "number" },
                  inherent_consequence: { type: "number" },
                  existing_controls: { type: "string" },
                  treatment_action: { type: "string" },
                  treatment_option: { type: "string" }
                }
              }
            }
          }
        }
      });
      risks = result.risks || [];
    }

    // Auto-number them
    const numbered = risks.map((r, i) => ({
      ...r,
      risk_id: `R-AI-${String(i + 1).padStart(3, "0")}`,
      status: "Identified",
      inherent_likelihood: Math.min(5, Math.max(1, Number(r.inherent_likelihood) || 3)),
      inherent_consequence: Math.min(5, Math.max(1, Number(r.inherent_consequence) || 3)),
    }));

    setExtractedRisks(numbered);
    setSelected(new Set(numbered.map((_, i) => i)));
    setStage("review");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const toggleSelect = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleImport = async () => {
    setImporting(true);
    const toImport = extractedRisks.filter((_, i) => selected.has(i));
    await base44.entities.Risk.bulkCreate(toImport);
    toast({ title: `${toImport.length} risk${toImport.length !== 1 ? "s" : ""} imported successfully` });
    setImporting(false);
    setStage("done");
    onRisksImported?.();
    setTimeout(() => { setOpen(false); setStage("upload"); setExtractedRisks([]); setSelected(new Set()); }, 1500);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        AI Import from Document
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setStage("upload"); setExtractedRisks([]); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Risk Extractor
            </DialogTitle>
          </DialogHeader>

          {stage === "upload" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload your Word document, PDF, or text file. The AI will read it and extract risks aligned with AS ISO 31000:2018 and AS/NZS 4360.
              </p>
              <div
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-all"
                onClick={() => fileRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
              >
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Drop your file here or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports .docx, .pdf, .txt, .html</p>
                <input ref={fileRef} type="file" className="hidden" accept=".docx,.pdf,.txt,.html,.doc"
                  onChange={e => handleFile(e.target.files[0])} />
              </div>
            </div>
          )}

          {stage === "extracting" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-amber-500" />
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-primary absolute -bottom-1 -right-1" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Analysing your document…</p>
                <p className="text-sm text-muted-foreground mt-1">Extracting risks aligned with AS ISO 31000:2018</p>
                <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>
              </div>
            </div>
          )}

          {stage === "review" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found <span className="font-semibold text-foreground">{extractedRisks.length} risks</span> — select which to import
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(extractedRisks.map((_, i) => i)))}>All</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>None</Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {extractedRisks.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => toggleSelect(i)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selected.has(i) ? "border-primary bg-primary/5" : "border-border bg-muted/20 opacity-60"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${selected.has(i) ? "bg-primary" : "bg-muted border border-border"}`}>
                        {selected.has(i) && <Check className="w-3 h-3 text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{r.risk_id}</span>
                          <Badge variant="outline" className="text-xs">{r.category}</Badge>
                          <RiskBadge likelihood={r.inherent_likelihood} consequence={r.inherent_consequence} />
                          {r.treatment_option && (
                            <span className="text-xs text-muted-foreground">· {r.treatment_option}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-foreground">{r.title}</p>
                        {r.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.description}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">{selected.size} of {extractedRisks.length} selected</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setStage("upload"); setExtractedRisks([]); }}>Re-upload</Button>
                  <Button onClick={handleImport} disabled={selected.size === 0 || importing} className="gap-2">
                    {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Import {selected.size} Risk{selected.size !== 1 ? "s" : ""}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              <p className="font-semibold text-foreground">Risks imported successfully!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}