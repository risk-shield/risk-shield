import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Shield, Database, Bot, ChevronRight, Loader2, Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

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
    starter: "How do I score a risk correctly using AS/NZS 4360?"
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
    starter: "Run a full data integrity check on the risk register and give me a quality report."
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
    starter: "Analyse the audit log and give me a security and governance health report."
  }
];

function AgentChat({ agent, onClose }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    base44.agents.createConversation({
      agent_name: agent.id,
      metadata: { name: `${agent.name} Session` }
    }).then(conv => {
      setConversation(conv);
      setMessages(conv.messages || []);
      setStarting(false);
    });
  }, [agent.id]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      setLoading(false);
    });
    return unsub;
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || !conversation || loading) return;
    setInput("");
    setLoading(true);
    await base44.agents.addMessage(conversation, { role: "user", content: msg });
  };

  const Icon = agent.icon;

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border flex-shrink-0">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", agent.color)}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-foreground">{agent.name}</p>
          <p className="text-xs text-muted-foreground">{agent.tagline}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="w-4 h-4" /></Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {starting ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
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
            {messages.filter(m => m.role !== "system").map((msg, i) => (
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
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border flex-shrink-0">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={`Ask ${agent.name}…`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            disabled={loading || starting}
          />
          <Button size="icon" onClick={() => send()} disabled={!input.trim() || loading || starting}>
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
    return (
      <div className="h-screen flex flex-col">
        <AgentChat agent={activeAgent} onClose={() => setActiveAgent(null)} />
      </div>
    );
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
          These agents have read access to your Risk Register and Audit Log. The <strong>Risk Advisor</strong> provides expert guidance aligned with AS ISO 31000:2018.
          The <strong>Data Integrity</strong> agent ensures your data is complete and governance-ready.
          The <strong>Security Auditor</strong> monitors your audit trail for anomalies and information security concerns.
          All agents operate with principle of least privilege — they can only read, never modify, your data.
        </p>
      </div>
    </div>
  );
}