import { useState } from "react";
import { authStore } from "@/lib/localStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, ArrowRight, BarChart2, FileText, Sparkles, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to RiskShield",
    subtitle: "Your ISO 31000-aligned risk management platform",
    icon: Shield,
    color: "bg-primary",
  },
  {
    id: "about",
    title: "Tell us about your role",
    subtitle: "We'll personalise your experience",
    icon: ClipboardList,
    color: "bg-blue-600",
  },
  {
    id: "how-it-works",
    title: "How RiskShield works",
    subtitle: "3 minutes to understand the system",
    icon: BarChart2,
    color: "bg-emerald-600",
  },
  {
    id: "standards",
    title: "The standards behind the system",
    subtitle: "Built on AS ISO 31000:2018 & AS/NZS 4360",
    icon: FileText,
    color: "bg-amber-500",
  },
  {
    id: "ai",
    title: "Your AI team is ready",
    subtitle: "Three intelligent agents to support you",
    icon: Sparkles,
    color: "bg-purple-600",
  },
];

export default function OnboardingWizard({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [department, setDepartment] = useState("");
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleNext = async () => {
    if (step === 1 && department) {
      await authStore.updateMe({ department });
    }
    if (isLast) {
      setSaving(true);
      await authStore.updateMe({ onboarding_complete: true });
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className="p-8 space-y-6">
          {/* Icon */}
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto", current.color)}>
            <Icon className="w-7 h-7" />
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-display font-bold text-foreground">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{current.subtitle}</p>
          </div>

          {/* Step content */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                RiskShield provides a structured, auditable process for identifying, assessing, treating and monitoring risks — built on internationally recognised standards.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[
                  { label: "Risk Register", desc: "Capture and track all risks" },
                  { label: "Risk Matrix", desc: "Visual 5×5 heat map" },
                  { label: "Treatment Plans", desc: "Action tracking & deadlines" },
                  { label: "Audit Log", desc: "Full governance trail" },
                ].map(f => (
                  <div key={f.label} className="p-3 rounded-lg bg-muted/40 border border-border">
                    <p className="text-xs font-semibold text-foreground">{f.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Your name</Label>
                <Input value={user?.full_name || ""} disabled className="bg-muted/40" />
              </div>
              <div className="space-y-1.5">
                <Label>Department / Business Unit</Label>
                <Input
                  placeholder="e.g. Operations, Finance, Executive"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                />
              </div>
              <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                Your role determines what you can do in the system. Contact your administrator to change your access level.
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              {[
                { n: "1", title: "Identify", desc: "Add risks to the Register — give each a title, category, and description" },
                { n: "2", title: "Assess", desc: "Score Likelihood × Consequence to get the inherent risk rating (before controls)" },
                { n: "3", title: "Control", desc: "Document existing controls, then re-score to get the residual (real) risk" },
                { n: "4", title: "Treat", desc: "Assign treatment actions, owners, and due dates on the Treatment Plans page" },
                { n: "5", title: "Monitor", desc: "Set review dates — RiskShield will send you reminders automatically" },
              ].map(s => (
                <div key={s.n} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">RiskShield is built on two internationally recognised standards:</p>
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm font-semibold text-foreground">AS ISO 31000:2018</p>
                  <p className="text-xs text-muted-foreground mt-1">Risk Management — Guidelines. The primary standard defining principles, framework, and process for managing risk across any organisation.</p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm font-semibold text-foreground">AS/NZS 4360</p>
                  <p className="text-xs text-muted-foreground mt-1">The predecessor Australian standard that defined the 5×5 likelihood/consequence matrix still used widely in Australian risk practice.</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  The risk matrix in RiskShield uses the 5×5 grid from AS/NZS 4360, with ratings: Low (1–4), Medium (5–9), High (10–14), Extreme (15–25).
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-3">
              {[
                { name: "Risk Advisor", color: "bg-blue-600", desc: "Ask any risk management question, get help with the register, understand your risk scores" },
                { name: "Data Integrity", color: "bg-emerald-600", desc: "Scans your register for missing fields, inconsistencies, and governance gaps — with a quality score" },
                { name: "Security Auditor", color: "bg-primary", desc: "Monitors your audit log for anomalies, unexplained changes, and information security concerns" },
              ].map(a => (
                <div key={a.name} className="flex gap-3 p-3 rounded-lg border border-border bg-muted/30">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0", a.color)}>
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{a.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center pt-1">Access all agents via the <strong>AI Agents</strong> page in the sidebar.</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={cn("w-2 h-2 rounded-full transition-all", i === step ? "bg-primary w-4" : "bg-muted")} />
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>Back</Button>
              )}
              <Button size="sm" onClick={handleNext} disabled={saving} className="gap-1.5">
                {isLast ? (saving ? "Finishing..." : <><CheckCircle2 className="w-4 h-4" /> Get Started</>) : <><ArrowRight className="w-4 h-4" /> Next</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}