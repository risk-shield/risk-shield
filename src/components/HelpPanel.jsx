import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { HelpCircle, BookOpen, Shield, Database, ChevronRight, ExternalLink, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const HELP_TOPICS = [
  {
    id: "getting-started",
    label: "Getting Started",
    icon: BookOpen,
    color: "text-blue-600 bg-blue-50",
    sections: [
      {
        title: "What is RiskShield?",
        content: "RiskShield is an enterprise risk management platform built on AS ISO 31000:2018 and AS/NZS 4360 standards. It provides a structured, auditable process for identifying, assessing, treating, and monitoring risks across your organisation."
      },
      {
        title: "The 5-Step Risk Process",
        content: "1. Identify — Add risks to the Register with a clear title, description and category.\n2. Assess — Score inherent risk (before controls) using Likelihood × Consequence.\n3. Control — Document existing controls and assign treatment actions.\n4. Residual Score — Re-score after controls to see actual risk exposure.\n5. Monitor — Set review dates and track status through the Treatment Plans page."
      },
      {
        title: "Key Screens",
        content: "• Dashboard — Live risk exposure overview and KPIs\n• Risk Register — Full table of all risks with filtering and sorting\n• Risk Matrix — Visual 5×5 heat map (inherent and residual views)\n• Treatment Plans — Action tracking with overdue alerts\n• Audit Log — Complete change history for governance and compliance"
      }
    ]
  },
  {
    id: "risk-scoring",
    label: "Risk Scoring",
    icon: Shield,
    color: "text-primary bg-primary/10",
    sections: [
      {
        title: "Likelihood Scale (AS/NZS 4360)",
        content: "1 — Rare: May occur only in exceptional circumstances (< once in 10 years)\n2 — Unlikely: Could occur at some time (once in 3–10 years)\n3 — Possible: Might occur at some time (once in 1–3 years)\n4 — Likely: Will probably occur in most circumstances (once per year)\n5 — Almost Certain: Is expected to occur in most circumstances (multiple times/year)"
      },
      {
        title: "Consequence Scale",
        content: "1 — Insignificant: Negligible impact, handled by routine operations\n2 — Minor: Small impact, managed with minor effort\n3 — Moderate: Significant impact requiring management attention\n4 — Major: Major impact affecting strategic objectives\n5 — Catastrophic: Critical/existential impact to the organisation"
      },
      {
        title: "Risk Rating Matrix",
        content: "Risk Score = Likelihood × Consequence\n\n• Low: 1–4 (green) — Monitor routinely\n• Medium: 5–9 (yellow) — Manage and reduce\n• High: 10–14 (orange) — Urgent treatment required\n• Extreme: 15–25 (red) — Immediate executive action\n\nAlways aim to reduce Extreme and High risks to Medium or Low through effective controls."
      },
      {
        title: "Inherent vs Residual Risk",
        content: "Inherent Risk — the raw risk BEFORE any controls or treatment actions are applied. This reflects the true magnitude of the risk to your organisation.\n\nResidual Risk — the remaining risk AFTER controls are in place and treatment actions implemented. This is your actual current exposure.\n\nThe gap between inherent and residual scores shows the effectiveness of your controls."
      }
    ]
  },
  {
    id: "treatment",
    label: "Treatment & Controls",
    icon: Database,
    color: "text-emerald-600 bg-emerald-50",
    sections: [
      {
        title: "ISO 31000 Treatment Options",
        content: "Avoid — Eliminate the risk entirely by not proceeding with the activity. Best for Extreme risks where no acceptable controls exist.\n\nReduce — Implement controls to lower likelihood and/or consequence. Most common treatment for High and Medium risks.\n\nTransfer — Share or transfer risk to a third party through insurance, contracts, or outsourcing. Suitable for financial and operational risks.\n\nAccept — Acknowledge and document the risk with rationale. Appropriate for Low risks or where treatment costs exceed benefit."
      },
      {
        title: "Documenting Controls",
        content: "Existing Controls — Describe what is already in place to manage this risk. Be specific: policies, procedures, systems, training, or physical controls.\n\nTreatment Action — The additional action needed to further reduce the risk. Assign a Treatment Owner and Target Date to ensure accountability.\n\nGood controls are: Specific, Measurable, Assigned to an owner, Time-bound, and Documented."
      },
      {
        title: "Review Cycle",
        content: "Best practice review frequencies:\n• Extreme risks — Monthly review\n• High risks — Quarterly review\n• Medium risks — 6-monthly review\n• Low risks — Annual review\n\nSet Review Dates on every risk. The Dashboard and Treatment Plans page will flag overdue items automatically."
      }
    ]
  },
  {
    id: "ai-agents",
    label: "AI Agents",
    icon: Sparkles,
    color: "text-amber-600 bg-amber-50",
    sections: [
      {
        title: "Risk Advisor",
        content: "Your AI risk management expert. Ask it anything — how to score a specific risk, how to interpret the matrix, what ISO 31000 says about a situation, or get tailored advice on managing a specific risk in your register. Access via your app dashboard."
      },
      {
        title: "Data Integrity Agent",
        content: "Automatically scans your entire risk register for quality issues: missing fields, inconsistencies (residual > inherent), unassigned owners, undocumented Extreme risks, and overdue reviews. Run it regularly to maintain governance standards. Returns a data quality score and prioritised fix list."
      },
      {
        title: "Security Auditor Agent",
        content: "Analyses your audit log to detect anomalies: unusual deletion patterns, unexplained risk downgrades, bulk changes, and governance gaps. Produces a security health report with evidence-based findings. Run before board or compliance reviews to ensure system integrity."
      }
    ]
  }
];

export default function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState(HELP_TOPICS[0]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/60 transition-colors"
        title="Help & Guidance"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden flex flex-col" side="right">
          <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
            <SheetTitle className="font-display flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              Help & Guidance
            </SheetTitle>
            <p className="text-xs text-muted-foreground">AS ISO 31000:2018 · AS/NZS 4360 Reference Guide</p>
          </SheetHeader>

          <div className="flex flex-1 overflow-hidden">
            {/* Topic list */}
            <div className="w-44 flex-shrink-0 border-r border-border bg-muted/30 py-3">
              {HELP_TOPICS.map(topic => {
                const Icon = topic.icon;
                const active = activeTopic.id === topic.id;
                return (
                  <button
                    key={topic.id}
                    onClick={() => setActiveTopic(topic)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "bg-background text-foreground font-medium border-r-2 border-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="leading-tight">{topic.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {activeTopic.sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", activeTopic.color.split(" ")[0].replace("text-", "bg-"))} />
                    {section.title}
                  </h3>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/30 rounded-lg p-3">
                    {section.content}
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  For personalised guidance, use the <strong>Risk Advisor AI agent</strong> in your dashboard.
                </p>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}