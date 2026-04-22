import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { makeEntityStore } from "@/lib/localStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Database, Bot, ChevronRight, Loader2, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const RiskStore = makeEntityStore("Risk");
const AuditStore = makeEntityStore("RiskAuditLog");

const AGENTS = [
  {
    id: "risk_advisor",
    name: "Risk Advisor",
    tagline: "Your ISO 31000 risk management expert",
    description: "Ask anything about risk management, get help filling in the register, understand your scores, or get advice on treatment options.",
    icon: Bot,
    color: "bg-blue-600",
    lightColor: "bg-blue-50 text-blue-700 border-blue-200",
    capabilities: ["Risk assessment guidance", "ISO 31000 explanations", "Register walkthrough", "Treatment advice"],
    starter: "How do I score a risk correctly using AS/NZS 4360?",
    systemPrompt: `You are an expert risk management consultant specialising in AS ISO 31000:2018 and AS/NZS 4360. 
You help organisations identify, assess, treat and monitor risks. You are precise, professional, and practical.
Always reference the relevant standards when giving advice.`
  },
  {
    id: "data_integrity",
    name: "Data Integrity",
    tagline: "Risk register quality & completeness monitor",
    description: "Scans the entire risk register for missing fields, inconsistencies, and governance gaps. Returns a data quality score with prioritised fixes.",
    icon: Database,
    color: "bg-emerald-600",
    lightColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    capabilities: ["Missing field detection", "Inconsistency analysis", "Governance gap identification", "Data quality scoring"],
    starter: "Run a full data integrity check on the risk register and give me a quality report.",
    systemPrompt: `You are a data governance analyst specialising in risk register quality for AS ISO 31000:2018 compliance.
When given risk register data, you check for: missing required fields, inconsistencies between inherent and residual scores, 
risks with no treatment actions, overdue items, incomplete ownership, and governance gaps.
Provide a quality score out of 100 and a prioritised list of recommended fixes.`
  },
  {
    id: "security_auditor",
    name: "Security Auditor",
    tagline: "Governance & information security monitor",
    description: "Analyses your audit log for anomalies, unexplained changes, bulk deletions, risk downgrades, and other security concerns.",
    icon: Shield,
    color: "bg-primary",
    lightColor: "bg-primary/10 text-primary border-primary/20",
    capabilities: ["Audit log anomaly detection", "Governance breach identification", "Risk downgrade alerts", "Security health scoring"],
    starter: "Analyse the audit log and give me a security and governance health report.",
    systemPrompt: `You are an information security and governance auditor. You analyse risk management audit logs for:
anomalies, unexplained bulk changes, risk rating downgrades without justification, deleted records, 
unusual activity patterns, and governance concerns.
Provide a security health score and flag any items requiring immediate attention.`
  }
];

function AgentChat({ agent, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");

    const userMsg = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setLoading(true);

    // Gather context data for the agent
    let contextData = "";
    if (agent.id === "data_integrity") {
      const risks = await RiskStore.list("-created_date", 200);
      contextData = `\n\nCurrent Risk Register (${risks.length} risks):\n${JSON.stringify(risks.map(r => ({
        id: r.risk_id || r.id,
        title: r.title,
        category: r.category,
        status: r.status,
        inherent_likelihood: r.inherent_likelihood,
        inherent_consequence: r.inherent_consequence,
        residual_likelihood: r.residual_likelihood,
        residual_consequence: r.residual_consequence,
        risk_owner: r.risk_owner,
        treatment_option: r.treatment_option,
        treatment_owner: r.treatment_owner,
        target_date: r.target_date,
        review_date: r.review_date,
        existing_controls: r.existing_controls ? "present" : "missing",
        treatment_action: r.treatment_action ? "present" : "missing",
      })), null, 2)}`;
    } else if (agent.id === "security_auditor") {
      const logs = await AuditStore.list("-created_date", 100);
      contextData = `\n\nAudit Log (last ${logs.length} entries):\n${JSON.stringify(logs.map(l => ({
        action: l.action,
        risk_title: l.risk_title,
        changed_by: l.changed_by,
        date: l.created_date,
        changes_count: l.changes?.length || 0,
      })), null, 2)}`;
    }

    const historyForLLM = updated.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n");

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `${agent.systemPrompt}${contextData}\n\nConversation:\n${historyForLLM}\n\nAssistant:`,
    });

    setMessages(prev => [...prev, { role: "assistant", content: typeof response === "string" ? response : JSON.stringify(response) }]);
    setLoading(false);
  };

  const Icon = agent.icon;

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0 bg-card">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", agent.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">{agent.name}</p>
          <p className="text-xs text-muted-foreground">{agent.tagline}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center pt-4">{agent.description}</p>
            <p className="text-xs text-muted-foreground text-center">Try asking:</p>
            <button
              onClick={() => send(agent.starter)}
              className="w-full text-left p-3 rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/60 text-sm text-muted-foreground transition-colors"
            >
              "{agent.starter}"
            </button>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-foreground"
            )}>
              {msg.role === "user" ? (
                <p>{msg.content}</p>
              ) : (
                <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  {msg.content}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-6 py-4 border-t border-border flex-shrink-0 bg-card">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={`Ask ${agent.name}…`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            disabled={loading}
          />
          <Button size="icon" onClick={() => send()} disabled={!input.trim() || loading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AgentHub() {
  const [activeAgent, setActiveAgent] = useState(null);

  if (activeAgent) {
    return <AgentChat agent={activeAgent} onClose={() => setActiveAgent(null)} />;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-display text-foreground">AI Agent Hub</h1>
          <p className="text-sm text-muted-foreground">Intelligent agents to maintain integrity, security, and guide users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {AGENTS.map(agent => {
          const Icon = agent.icon;
          return (
            <Card key={agent.id} className="flex flex-col hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setActiveAgent(agent)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0", agent.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform mt-1" />
                </div>
                <CardTitle className="text-base mt-3">{agent.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{agent.tagline}</p>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground">{agent.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {agent.capabilities.map(cap => (
                    <Badge key={cap} variant="outline" className={cn("text-xs border", agent.lightColor)}>{cap}</Badge>
                  ))}
                </div>
                <Button className="w-full gap-2 mt-2" size="sm">
                  <Icon className="w-3.5 h-3.5" /> Open {agent.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-muted/40 border border-border">
        <p className="text-sm font-medium text-foreground mb-1">About the AI Agents</p>
        <p className="text-sm text-muted-foreground">
          These agents have read access to your local Risk Register and Audit Log. The <strong>Risk Advisor</strong> provides expert guidance aligned with AS ISO 31000:2018.
          The <strong>Data Integrity</strong> agent ensures your data is complete and governance-ready.
          The <strong>Security Auditor</strong> monitors your audit trail for anomalies and information security concerns.
        </p>
      </div>
    </div>
  );
}