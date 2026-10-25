import { db, check } from "../lib/supabase";
import type { Json, Database } from "../types/database";
export const statuses = [
  "novo",
  "em_atendimento",
  "orcamento_enviado",
  "convertido",
  "perdido",
];
export type Lead = Database["public"]["Tables"]["leads"]["Row"] & {
  lead_items: { id: string }[];
};
export type CrmStats = {
  total: number;
  statuses: Record<string, number>;
  recent: Lead[];
};
export async function crmDashboard() {
  const { data, error } = await db().rpc("elite_crm_dashboard" as never);
  check(error);
  return data as unknown as CrmStats;
}
export async function listLeads(filters: Record<string, string>) {
  const { data, error } = await db().rpc(
    "elite_list_leads" as never,
    { filters: filters as Json } as never,
  );
  check(error);
  return data as unknown as { rows: Lead[]; total: number };
}
export async function leadDetail(id: string) {
  const [lead, items, events] = await Promise.all([
    db().from("leads").select("*").eq("id", id).single(),
    db().from("lead_items").select("*").eq("lead_id", id).order("created_at"),
    db()
      .from("lead_events")
      .select("*")
      .eq("lead_id", id)
      .order("created_at", { ascending: false }),
  ]);
  check(lead.error);
  check(items.error);
  check(events.error);
  return { lead: lead.data!, items: items.data!, events: events.data! };
}
export async function updateLead(id: string, situation: string, note: string) {
  const { error } = await db().rpc(
    "elite_update_lead" as never,
    { lead: id, situation, note } as never,
  );
  check(error);
}
