import { useState } from "react";
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

const RATING_COLOR = {
  Low:     { fill: [209, 250, 229], text: [22, 101, 52] },
  Medium:  { fill: [254, 243, 199], text: [113, 63, 18] },
  High:    { fill: [255, 237, 213], text: [124, 45, 18] },
  Extreme: { fill: [254, 226, 226], text: [127, 29, 29] },
};

// Draw a simple table; returns the Y position after the table
function drawTable(doc, { startX, startY, colWidths, headers, rows, pageH, marginBottom = 12 }) {
  const rowH = 8;
  const headerH = 9;
  const W = colWidths.reduce((a, b) => a + b, 0);

  let y = startY;

  const addPageIfNeeded = (neededH) => {
    if (y + neededH > pageH - marginBottom) {
      doc.addPage();
      y = 14;
      // Redraw header
      drawRow(true, headers, y);
      y += headerH;
    }
  };

  const drawRow = (isHeader, cells, rowY) => {
    let x = startX;
    cells.forEach((cell, ci) => {
      const w = colWidths[ci];
      const text = String(cell?.value ?? cell ?? "");
      const rating = cell?.rating;

      if (isHeader) {
        doc.setFillColor(30, 41, 82);
        doc.rect(x, rowY, w, headerH, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
      } else {
        if (rating && RATING_COLOR[rating]) {
          const [r, g, b] = RATING_COLOR[rating].fill;
          doc.setFillColor(r, g, b);
          doc.rect(x, rowY, w, rowH, "F");
          const [tr, tg, tb] = RATING_COLOR[rating].text;
          doc.setTextColor(tr, tg, tb);
          doc.setFont("helvetica", "bold");
        } else {
          doc.setTextColor(30, 41, 82);
          doc.setFont("helvetica", "normal");
        }
        doc.setFontSize(7);
      }

      doc.setDrawColor(210, 215, 225);
      doc.rect(x, rowY, w, isHeader ? headerH : rowH, "D");

      // Clip text to cell width with ellipsis
      const maxChars = Math.floor(w / 1.8);
      const display = text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
      doc.text(display, x + 2, rowY + (isHeader ? headerH : rowH) - 2.5);

      x += w;
    });
  };

  // Header
  drawRow(true, headers, y);
  y += headerH;

  // Rows
  rows.forEach((row, ri) => {
    addPageIfNeeded(rowH);
    // Alternating row background
    if (ri % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(startX, y, W, rowH, "F");
    }
    drawRow(false, row, y);
    y += rowH;
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
    setTimeout(() => {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const now = format(new Date(), "dd MMMM yyyy");

      const sorted = [...risks].sort((a, b) =>
        (RATING_ORDER[getRiskRating(a.inherent_likelihood, a.inherent_consequence)] ?? 4) -
        (RATING_ORDER[getRiskRating(b.inherent_likelihood, b.inherent_consequence)] ?? 4)
      );

      // ── Cover page ──
      doc.setFillColor(30, 41, 82);
      doc.rect(0, 0, W, H, "F");
      doc.setFillColor(37, 99, 235);
      doc.rect(0, H - 18, W, 18, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.text("RISK MANAGEMENT REPORT", W / 2, 55, { align: "center" });

      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 200, 255);
      doc.text("Aligned with AS ISO 31000:2018 · AS/NZS 4360", W / 2, 68, { align: "center" });

      if (orgName) {
        doc.setFontSize(18);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(orgName, W / 2, 88, { align: "center" });
      }

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(180, 200, 255);
      doc.text(`Prepared: ${now}`, W / 2, orgName ? 100 : 88, { align: "center" });
      if (preparedBy) doc.text(`Prepared by: ${preparedBy}`, W / 2, (orgName ? 100 : 88) + 8, { align: "center" });

      // Summary boxes
      const counts = { Extreme: 0, High: 0, Medium: 0, Low: 0 };
      sorted.forEach(r => { const rt = getRiskRating(r.inherent_likelihood, r.inherent_consequence); if (rt) counts[rt]++; });
      const boxColors = { Extreme: [239, 68, 68], High: [249, 115, 22], Medium: [245, 158, 11], Low: [34, 197, 94] };
      const labels = ["Extreme", "High", "Medium", "Low"];
      const boxW = 42, gap = 8, totalW = labels.length * boxW + (labels.length - 1) * gap;
      let bx = (W - totalW) / 2;
      labels.forEach(l => {
        const [r, g, b] = boxColors[l];
        doc.setFillColor(r, g, b);
        doc.roundedRect(bx, 130, boxW, 24, 3, 3, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text(String(counts[l]), bx + boxW / 2, 144, { align: "center" });
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(l, bx + boxW / 2, 151, { align: "center" });
        bx += boxW + gap;
      });

      doc.setTextColor(180, 200, 255);
      doc.setFontSize(9);
      doc.text(`Total risks assessed: ${risks.length}`, W / 2, H - 6, { align: "center" });

      const addSectionHeader = (title) => {
        doc.addPage();
        doc.setFillColor(30, 41, 82);
        doc.rect(0, 0, W, 14, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, 9.5);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(180, 200, 255);
        doc.text(`${orgName ? orgName + "  ·  " : ""}${now}`, W - 14, 9.5, { align: "right" });
        return 18;
      };

      // ── Risk Register ──
      if (includeRegister) {
        const startY = addSectionHeader("RISK REGISTER");
        drawTable(doc, {
          startX: 10,
          startY,
          pageH: H,
          colWidths: [16, 58, 28, 22, 22, 18, 18, 30, 24],
          headers: ["ID", "Risk Title", "Category", "Likelihood", "Consequence", "Inherent", "Residual", "Owner", "Status"],
          rows: sorted.map(r => {
            const iR = getRiskRating(r.inherent_likelihood, r.inherent_consequence);
            const rR = getRiskRating(r.residual_likelihood, r.residual_consequence);
            return [
              r.risk_id || "",
              r.title || "",
              r.category || "",
              r.inherent_likelihood ? `${r.inherent_likelihood} – ${LIKELIHOOD_LABELS[r.inherent_likelihood]}` : "",
              r.inherent_consequence ? `${r.inherent_consequence} – ${CONSEQUENCE_LABELS[r.inherent_consequence]}` : "",
              { value: iR || "", rating: iR },
              { value: rR || "—", rating: rR },
              r.risk_owner || "",
              r.status || "",
            ];
          }),
        });
      }

      // ── Treatment Plans ──
      if (includeTreatments) {
        const withT = sorted.filter(r => r.treatment_action || r.existing_controls);
        if (withT.length > 0) {
          const startY = addSectionHeader("RISK TREATMENT PLANS");
          drawTable(doc, {
            startX: 10,
            startY,
            pageH: H,
            colWidths: [15, 45, 18, 22, 44, 54, 24, 24],
            headers: ["ID", "Risk Title", "Rating", "Treatment", "Existing Controls", "Treatment Actions", "Owner", "Target Date"],
            rows: withT.map(r => {
              const iR = getRiskRating(r.inherent_likelihood, r.inherent_consequence);
              return [
                r.risk_id || "",
                r.title || "",
                { value: iR || "", rating: iR },
                r.treatment_option || "",
                r.existing_controls || "—",
                r.treatment_action || "—",
                r.treatment_owner || "",
                r.target_date ? format(parseISO(r.target_date), "dd MMM yy") : "—",
              ];
            }),
          });
        }
      }

      // ── Risk Matrix visual ──
      if (includeMatrix) {
        addSectionHeader("RISK MATRIX — INHERENT RISK POSITION");

        const CELL_MATRIX = [
          ["Low","Low","Medium","Medium","High"],
          ["Low","Low","Medium","High","High"],
          ["Low","Medium","Medium","High","High"],
          ["Medium","Medium","High","High","Extreme"],
          ["Medium","High","High","Extreme","Extreme"],
        ];
        const cellColors = {
          Low: [209, 250, 229], Medium: [254, 243, 199],
          High: [255, 237, 213], Extreme: [254, 226, 226]
        };
        const lLabels = ["Almost Certain (5)", "Likely (4)", "Possible (3)", "Unlikely (2)", "Rare (1)"];
        const cLabels = ["Insignificant\n(1)", "Minor\n(2)", "Moderate\n(3)", "Major\n(4)", "Catastrophic\n(5)"];

        const startX = 52, startY = 22, cellW = 38, cellH = 22;

        // Column headers
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 82);
        cLabels.forEach((l, ci) => {
          doc.text(l.replace("\n", " "), startX + ci * cellW + cellW / 2, startY - 3, { align: "center" });
        });
        doc.setFontSize(7.5);
        doc.text("← Consequence →", startX + (5 * cellW) / 2, startY - 10, { align: "center" });

        // Row headers + cells
        lLabels.forEach((l, li) => {
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(30, 41, 82);
          doc.text(l, startX - 3, startY + li * cellH + cellH / 2 + 1, { align: "right" });

          for (let ci = 0; ci < 5; ci++) {
            const rating = CELL_MATRIX[4 - li][ci];
            const [r, g, b] = cellColors[rating] || [255, 255, 255];
            doc.setFillColor(r, g, b);
            doc.setDrawColor(200, 205, 215);
            doc.rect(startX + ci * cellW, startY + li * cellH, cellW, cellH, "FD");

            const cellRisks = sorted.filter(r2 =>
              r2.inherent_likelihood === (5 - li) && r2.inherent_consequence === (ci + 1)
            );
            if (cellRisks.length > 0) {
              doc.setFontSize(6.5);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(30, 41, 82);
              cellRisks.slice(0, 3).forEach((cr, idx) => {
                const label = (cr.risk_id || cr.title?.slice(0, 8) || "R");
                doc.text(label, startX + ci * cellW + cellW / 2, startY + li * cellH + 7 + idx * 5.5, { align: "center" });
              });
              if (cellRisks.length > 3) {
                doc.setFontSize(6);
                doc.setTextColor(100, 100, 120);
                doc.text(`+${cellRisks.length - 3} more`, startX + ci * cellW + cellW / 2, startY + li * cellH + cellH - 2, { align: "center" });
              }
            } else {
              doc.setFontSize(7);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(160, 170, 180);
              doc.text(rating, startX + ci * cellW + cellW / 2, startY + li * cellH + cellH / 2 + 1, { align: "center" });
            }
          }
        });

        // Y label
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 41, 82);
        doc.text("← Likelihood →", 10, startY + (5 * cellH) / 2, { align: "center", angle: 90 });

        // Legend
        const legX = startX + 5 * cellW + 12;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Legend", legX, startY + 4);
        Object.entries(cellColors).reverse().forEach(([label, [r, g, b]], idx) => {
          doc.setFillColor(r, g, b);
          doc.setDrawColor(200, 205, 215);
          doc.rect(legX, startY + 10 + idx * 12, 10, 8, "FD");
          doc.setFontSize(7.5);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 82);
          doc.text(label, legX + 13, startY + 16 + idx * 12);
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
        doc.text("RiskShield  ·  AS ISO 31000:2018  ·  AS/NZS 4360  ·  CONFIDENTIAL", 14, H - 2.5);
        doc.text(`Page ${i} of ${pageCount}`, W - 14, H - 2.5, { align: "right" });
      }

      const filename = `Risk_Report_${orgName ? orgName.replace(/\s+/g, "_") + "_" : ""}${format(new Date(), "yyyyMMdd")}.pdf`;
      doc.save(filename);
      setGenerating(false);
      setOpen(false);
    }, 50);
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
              Generates a professional PDF report with cover page, risk register, treatment plans, and matrix visual.
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