import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FileDown, Loader2, FileText } from "lucide-react";
import { getRiskRating, LIKELIHOOD_LABELS, CONSEQUENCE_LABELS } from "@/lib/riskUtils";
import { format, parseISO } from "date-fns";
import jsPDF from "jspdf";

const RATING_ORDER = { Extreme: 0, High: 1, Medium: 2, Low: 3 };

const RATING_COLORS = {
  Low: [209, 250, 229],
  Medium: [254, 243, 199],
  High: [255, 237, 213],
  Extreme: [254, 226, 226],
};

// Draw a simple table manually
function drawTable(doc, { startX, startY, headers, rows, colWidths, pageW, pageH, rowHeight = 9 }) {
  const margin = startX;
  let y = startY;

  const checkNewPage = (h = rowHeight) => {
    if (y + h > pageH - 12) {
      doc.addPage();
      y = 16;
      // Redraw header
      drawHeader(true);
    }
  };

  const drawHeader = (redraw = false) => {
    doc.setFillColor(30, 41, 82);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    let x = startX;
    headers.forEach((h, i) => {
      doc.setFillColor(30, 41, 82);
      doc.rect(x, y, colWidths[i], rowHeight, "F");
      doc.text(h, x + 2, y + 6);
      x += colWidths[i];
    });
    y += rowHeight;
  };

  drawHeader();

  rows.forEach((row, ri) => {
    const cellH = rowHeight;
    checkNewPage(cellH);

    // Alternate row bg
    const bg = ri % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
    doc.setFillColor(...bg);
    let x = startX;
    colWidths.forEach(w => { doc.rect(x, y, w, cellH, "F"); x += w; });

    // Cell borders
    doc.setDrawColor(220, 220, 230);
    x = startX;
    colWidths.forEach(w => { doc.rect(x, y, w, cellH, "S"); x += w; });

    // Text
    doc.setTextColor(30, 41, 82);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    x = startX;
    row.forEach((cell, ci) => {
      const text = String(cell ?? "");
      const maxW = colWidths[ci] - 4;
      // Clip text to fit
      const clipped = doc.getTextWidth(text) > maxW
        ? text.slice(0, Math.floor(text.length * maxW / doc.getTextWidth(text))) + "…"
        : text;

      // Rating colour highlight
      if (RATING_COLORS[text]) {
        doc.setFillColor(...RATING_COLORS[text]);
        doc.rect(x + 1, y + 1.5, colWidths[ci] - 2, cellH - 3, "F");
        doc.setFont("helvetica", "bold");
      } else {
        doc.setFont("helvetica", "normal");
      }

      doc.setTextColor(30, 41, 82);
      doc.text(clipped, x + 2, y + 6);
      x += colWidths[ci];
    });
    y += cellH;
  });

  return y;
}

export default function RiskReportExport({ risks }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [preparedBy, setPreparedBy] = useState("");
  const [includeRegister, setIncludeRegister] = useState(true);
  const [includeTreatments, setIncludeTreatments] = useState(true);
  const [includeMatrix, setIncludeMatrix] = useState(true);

  const generate = () => {
    setGenerating(true);
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const now = format(new Date(), "dd MMMM yyyy");

    const sorted = [...risks].sort((a, b) =>
      (RATING_ORDER[getRiskRating(a.inherent_likelihood, a.inherent_consequence)] ?? 4) -
      (RATING_ORDER[getRiskRating(b.inherent_likelihood, b.inherent_consequence)] ?? 4)
    );

    const addPageHeader = (title) => {
      doc.setFillColor(30, 41, 82);
      doc.rect(0, 0, W, 14, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, 14, 9.5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 200, 255);
      doc.text(`${orgName ? orgName + "  ·  " : ""}${now}`, W - 14, 9.5, { align: "right" });
    };

    // ── Cover page ──
    doc.setFillColor(30, 41, 82);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(37, 99, 235);
    doc.rect(0, H - 18, W, 18, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("RISK MANAGEMENT REPORT", W / 2, 55, { align: "center" });
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 200, 255);
    doc.text("Aligned with AS ISO 31000:2018 · AS/NZS 4360", W / 2, 67, { align: "center" });

    if (orgName) {
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text(orgName, W / 2, 85, { align: "center" });
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 200, 255);
    doc.text(`Date: ${now}`, W / 2, 100, { align: "center" });
    if (preparedBy) doc.text(`Prepared by: ${preparedBy}`, W / 2, 108, { align: "center" });

    // Summary boxes
    const counts = { Extreme: 0, High: 0, Medium: 0, Low: 0 };
    sorted.forEach(r => { const rt = getRiskRating(r.inherent_likelihood, r.inherent_consequence); if (rt) counts[rt]++; });
    const boxColors = { Extreme: [239, 68, 68], High: [249, 115, 22], Medium: [245, 158, 11], Low: [34, 197, 94] };
    const bLabels = ["Extreme", "High", "Medium", "Low"];
    const boxW = 38, gap = 8;
    const totalW = bLabels.length * boxW + (bLabels.length - 1) * gap;
    let bx = (W - totalW) / 2;
    bLabels.forEach(l => {
      const [r, g, b] = boxColors[l];
      doc.setFillColor(r, g, b);
      doc.roundedRect(bx, 122, boxW, 22, 3, 3, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text(String(counts[l]), bx + boxW / 2, 136, { align: "center" });
      doc.setFontSize(8);
      doc.text(l, bx + boxW / 2, 142, { align: "center" });
      bx += boxW + gap;
    });

    doc.setTextColor(180, 200, 255);
    doc.setFontSize(8);
    doc.text(`Total risks recorded: ${risks.length}`, W / 2, H - 4, { align: "center" });

    // ── Risk Register ──
    if (includeRegister) {
      doc.addPage();
      addPageHeader("RISK REGISTER");
      drawTable(doc, {
        startX: 10, startY: 18, pageW: W, pageH: H,
        headers: ["ID", "Title", "Category", "Likelihood", "Consequence", "Rating", "Residual", "Owner", "Status"],
        colWidths: [16, 58, 28, 30, 30, 18, 18, 28, 22],
        rows: sorted.map(r => [
          r.risk_id || "",
          r.title || "",
          r.category || "",
          r.inherent_likelihood ? `${r.inherent_likelihood} – ${LIKELIHOOD_LABELS[r.inherent_likelihood]}` : "",
          r.inherent_consequence ? `${r.inherent_consequence} – ${CONSEQUENCE_LABELS[r.inherent_consequence]}` : "",
          getRiskRating(r.inherent_likelihood, r.inherent_consequence) || "",
          getRiskRating(r.residual_likelihood, r.residual_consequence) || "—",
          r.risk_owner || "",
          r.status || "",
        ]),
      });
    }

    // ── Treatment Plans ──
    if (includeTreatments) {
      const withTx = sorted.filter(r => r.treatment_action || r.existing_controls);
      if (withTx.length > 0) {
        doc.addPage();
        addPageHeader("RISK TREATMENT PLANS");
        drawTable(doc, {
          startX: 10, startY: 18, pageW: W, pageH: H,
          headers: ["ID", "Title", "Rating", "Option", "Existing Controls", "Treatment Actions", "Owner", "Target", "Status"],
          colWidths: [14, 44, 18, 20, 48, 56, 24, 22, 22],
          rows: withTx.map(r => [
            r.risk_id || "",
            r.title || "",
            getRiskRating(r.inherent_likelihood, r.inherent_consequence) || "",
            r.treatment_option || "",
            r.existing_controls || "—",
            r.treatment_action || "—",
            r.treatment_owner || "",
            r.target_date ? format(parseISO(r.target_date), "dd MMM yy") : "—",
            r.status || "",
          ]),
        });
      }
    }

    // ── Risk Matrix ──
    if (includeMatrix) {
      doc.addPage();
      addPageHeader("RISK MATRIX — INHERENT RISK POSITION");

      const CELL_MATRIX = [
        ["Low","Low","Medium","Medium","High"],
        ["Low","Low","Medium","High","High"],
        ["Low","Medium","Medium","High","High"],
        ["Medium","Medium","High","High","Extreme"],
        ["Medium","High","High","Extreme","Extreme"],
      ];
      const lLabels = ["Almost Certain","Likely","Possible","Unlikely","Rare"];
      const cLabels = ["Insignificant","Minor","Moderate","Major","Catastrophic"];
      const startX = 50, startY = 24, cellW = 38, cellH = 22;

      doc.setFontSize(7);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 82);
      cLabels.forEach((l, ci) => doc.text(l, startX + ci * cellW + cellW / 2, startY - 3, { align: "center" }));
      doc.text("← Consequence →", startX + (5 * cellW) / 2, startY - 8, { align: "center" });
      lLabels.forEach((l, li) => doc.text(l, startX - 4, startY + li * cellH + cellH / 2 + 1, { align: "right" }));
      doc.text("← Likelihood →", 10, startY + (5 * cellH) / 2, { align: "center", angle: 90 });

      for (let li = 0; li < 5; li++) {
        for (let ci = 0; ci < 5; ci++) {
          const rating = CELL_MATRIX[4 - li][ci];
          doc.setFillColor(...(RATING_COLORS[rating] || [255,255,255]));
          doc.setDrawColor(200, 200, 210);
          doc.rect(startX + ci * cellW, startY + li * cellH, cellW, cellH, "FD");

          const cellRisks = sorted.filter(r2 => r2.inherent_likelihood === (5 - li) && r2.inherent_consequence === (ci + 1));
          if (cellRisks.length > 0) {
            doc.setFontSize(6.5);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(30, 41, 82);
            cellRisks.slice(0, 3).forEach((cr, idx) => {
              const lbl = (cr.risk_id || cr.title?.slice(0, 8) || "R");
              doc.text(lbl, startX + ci * cellW + cellW / 2, startY + li * cellH + 8 + idx * 6, { align: "center" });
            });
            if (cellRisks.length > 3) {
              doc.setFontSize(6);
              doc.text(`+${cellRisks.length - 3}`, startX + ci * cellW + cellW / 2, startY + li * cellH + cellH - 2, { align: "center" });
            }
          } else {
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(160, 170, 180);
            doc.text(rating, startX + ci * cellW + cellW / 2, startY + li * cellH + cellH / 2 + 1, { align: "center" });
          }
        }
      }

      // Legend
      const legX = startX + 5 * cellW + 12, legY = startY;
      doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 41, 82);
      doc.text("Legend", legX, legY);
      Object.entries(RATING_COLORS).forEach(([label, rgb], idx) => {
        doc.setFillColor(...rgb);
        doc.setDrawColor(200, 200, 210);
        doc.rect(legX, legY + 4 + idx * 11, 9, 8, "FD");
        doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(30, 41, 82);
        doc.text(label, legX + 13, legY + 10 + idx * 11);
      });
    }

    // Footer on all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(37, 99, 235);
      doc.rect(0, H - 8, W, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text("RiskShield · AS ISO 31000:2018 · AS/NZS 4360 · CONFIDENTIAL", 14, H - 2.5);
      doc.text(`Page ${i} of ${pageCount}`, W - 14, H - 2.5, { align: "right" });
    }

    const filename = `Risk_Report_${orgName ? orgName.replace(/\s+/g, "_") + "_" : ""}${format(new Date(), "yyyyMMdd")}.pdf`;
    doc.save(filename);
    setGenerating(false);
    setOpen(false);
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <FileDown className="w-4 h-4" />
        Export PDF Report
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generate Risk Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Generates a professional PDF with cover page, risk register, treatment plans and matrix.
            </p>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Organisation Name</Label>
                <Input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. Acme Pty Ltd" />
              </div>
              <div className="space-y-1.5">
                <Label>Prepared By</Label>
                <Input value={preparedBy} onChange={e => setPreparedBy(e.target.value)} placeholder="Your name / role" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Include Sections</Label>
              {[
                { label: "Risk Register", value: includeRegister, set: setIncludeRegister },
                { label: "Treatment Plans", value: includeTreatments, set: setIncludeTreatments },
                { label: "Risk Matrix", value: includeMatrix, set: setIncludeMatrix },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center gap-2">
                  <Checkbox checked={value} onCheckedChange={set} id={label} />
                  <label htmlFor={label} className="text-sm text-foreground cursor-pointer">{label}</label>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={generate} disabled={generating} className="gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                {generating ? "Generating…" : `Generate PDF (${risks.length} risks)`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}