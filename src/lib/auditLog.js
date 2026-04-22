import { base44 } from "@/api/base44Client";

const FIELD_LABELS = {
  title: "Title",
  description: "Description",
  category: "Category",
  risk_owner: "Risk Owner",
  inherent_likelihood: "Inherent Likelihood",
  inherent_consequence: "Inherent Consequence",
  residual_likelihood: "Residual Likelihood",
  residual_consequence: "Residual Consequence",
  existing_controls: "Existing Controls",
  treatment_action: "Treatment Action",
  treatment_option: "Treatment Option",
  treatment_owner: "Treatment Owner",
  target_date: "Target Date",
  review_date: "Review Date",
  status: "Status",
  notes: "Notes",
  risk_id: "Risk ID",
};

const TRACKED_FIELDS = Object.keys(FIELD_LABELS);

export async function logRiskCreated(risk, user) {
  await base44.entities.RiskAuditLog.create({
    risk_id: risk.id,
    risk_title: risk.title,
    action: "created",
    changed_by: user?.email || "unknown",
    changed_by_name: user?.full_name || "Unknown",
    changes: [],
  });
}

export async function logRiskUpdated(oldRisk, newRisk, user) {
  const changes = [];
  TRACKED_FIELDS.forEach(field => {
    const oldVal = String(oldRisk[field] ?? "");
    const newVal = String(newRisk[field] ?? "");
    if (oldVal !== newVal) {
      changes.push({
        field: FIELD_LABELS[field] || field,
        old_value: oldVal,
        new_value: newVal,
      });
    }
  });

  if (changes.length === 0) return;

  await base44.entities.RiskAuditLog.create({
    risk_id: newRisk.id,
    risk_title: newRisk.title,
    action: "updated",
    changed_by: user?.email || "unknown",
    changed_by_name: user?.full_name || "Unknown",
    changes,
  });
}

export async function logRiskDeleted(risk, user) {
  await base44.entities.RiskAuditLog.create({
    risk_id: risk.id,
    risk_title: risk.title,
    action: "deleted",
    changed_by: user?.email || "unknown",
    changed_by_name: user?.full_name || "Unknown",
    changes: [],
  });
}