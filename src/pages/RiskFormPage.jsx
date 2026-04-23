import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { makeEntityStore, authStore } from "@/lib/localStore";
import { logRiskCreated, logRiskUpdated } from "@/lib/auditLog";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";
import RiskForm from "@/components/risks/RiskForm";

const RiskStore = makeEntityStore("Risk");

// This page is used on mobile for /register/add and /register/edit/:id
export default function RiskFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) { setInitial({}); return; }
    setLoading(true);
    const all = await RiskStore.list("-created_date", 500);
    const found = all.find(r => r.id === id);
    setInitial(found || {});
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    setSaving(true);
    const user = await authStore.me();
    if (id && initial?.id) {
      await RiskStore.update(id, form);
      await logRiskUpdated(initial, { ...initial, ...form }, user);
      toast({ title: "Risk updated" });
    } else {
      const created = await RiskStore.create(form);
      await logRiskCreated(created, user);
      toast({ title: "Risk added" });
    }
    setSaving(false);
    navigate("/register");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="p-4 pb-24 animate-fade-in">
      <RiskForm
        initial={initial || {}}
        onSave={handleSave}
        onCancel={() => navigate("/register")}
        loading={saving}
      />
    </div>
  );
}