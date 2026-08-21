import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase/client";
import type {
  CompanyResearch,
  ContextEntry,
  Opportunity,
  OpportunitySummary,
  OpportunityWithPreps,
  StageContent,
  StagePrep,
  StageType,
} from "@/types";

// Persistence for opportunities + stage preps. Backed by Supabase when
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are configured (see
// src/lib/supabase/schema.sql). Falls back to an in-memory store when they
// aren't, so `npm run dev` is usable end-to-end in a fresh Codespace before
// a Supabase project is provisioned. The in-memory store resets on every
// server restart and is not suitable for anything beyond local iteration.

interface MemoryDB {
  opportunities: Opportunity[];
  preps: StagePrep[];
  contextEntries: ContextEntry[];
}

const globalForMemory = globalThis as unknown as { __jaaMemoryDB?: MemoryDB };

function memoryDB(): MemoryDB {
  if (!globalForMemory.__jaaMemoryDB) {
    globalForMemory.__jaaMemoryDB = { opportunities: [], preps: [], contextEntries: [] };
  }
  return globalForMemory.__jaaMemoryDB;
}

// jdText is '' for a "Log Applied" quick-add (no JD collected yet) and the
// real JD text for the "New Opportunity" path, which generates the
// Recruiter Screen prep immediately. appliedDate is nullable so it can be
// left unset either way and backfilled later. additionalContext is null
// for "Log Applied" (added later via the Detail page, once the record
// already exists) and optionally supplied up front by "New Opportunity",
// since that path has no existing record to attach it to beforehand.
export async function createOpportunity(
  applicantName: string,
  company: string,
  role: string,
  jdText: string,
  appliedDate: string | null,
  additionalContext: string | null
): Promise<Opportunity> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("opportunities")
      .insert({
        applicant_name: applicantName,
        company,
        role,
        jd_text: jdText,
        applied_date: appliedDate,
        additional_context: additionalContext,
      })
      .select()
      .single();
    if (error) throw new Error(`createOpportunity: ${error.message}`);
    return rowToOpportunity(data);
  }

  const opportunity: Opportunity = {
    id: randomUUID(),
    applicantName,
    company,
    role,
    jdText,
    companyResearch: null,
    appliedDate,
    additionalContext,
    createdAt: new Date().toISOString(),
  };
  memoryDB().opportunities.unshift(opportunity);
  return opportunity;
}

// Sets the JD once a quick-added opportunity's first (Recruiter Screen)
// prep is generated — quick-add creates the record with jdText: '', this
// fills it in at that point so it's persisted and reused for stage 2 same
// as the "New Opportunity" path (see spec "JD carries forward").
export async function setOpportunityJdText(opportunityId: string, jdText: string): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("opportunities")
      .update({ jd_text: jdText })
      .eq("id", opportunityId);
    if (error) throw new Error(`setOpportunityJdText: ${error.message}`);
    return;
  }

  const opportunity = memoryDB().opportunities.find((o) => o.id === opportunityId);
  if (opportunity) opportunity.jdText = jdText;
}

// Backfill/edit for applied_date — manually editable on the Opportunity
// Detail page regardless of which path created the record (quick-add
// opportunities start with it set; New Opportunity ones do too; anything
// that predates this field starts null until set here).
export async function setOpportunityAppliedDate(
  opportunityId: string,
  appliedDate: string | null
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("opportunities")
      .update({ applied_date: appliedDate })
      .eq("id", opportunityId);
    if (error) throw new Error(`setOpportunityAppliedDate: ${error.message}`);
    return;
  }

  const opportunity = memoryDB().opportunities.find((o) => o.id === opportunityId);
  if (opportunity) opportunity.appliedDate = appliedDate;
}

// v3: persistent opportunity-wide running note, editable in place from the
// Opportunity Detail page. Distinct from a stage prep's `additionalContext`
// (one-shot, set at generation time and never edited afterward) — this one
// is updated directly, independent of any generation call.
export async function setOpportunityAdditionalContext(
  opportunityId: string,
  additionalContext: string | null
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("opportunities")
      .update({ additional_context: additionalContext })
      .eq("id", opportunityId);
    if (error) throw new Error(`setOpportunityAdditionalContext: ${error.message}`);
    return;
  }

  const opportunity = memoryDB().opportunities.find((o) => o.id === opportunityId);
  if (opportunity) opportunity.additionalContext = additionalContext;
}

// Call 1's research result, persisted once and reused for every later
// stage on this opportunity (firm requirement — see spec "Grounding &
// architecture"). Only ever called when an opportunity has no cached
// research yet.
export async function setOpportunityResearch(
  opportunityId: string,
  research: CompanyResearch
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase
      .from("opportunities")
      .update({ company_research: research })
      .eq("id", opportunityId);
    if (error) throw new Error(`setOpportunityResearch: ${error.message}`);
    return;
  }

  const opportunity = memoryDB().opportunities.find((o) => o.id === opportunityId);
  if (opportunity) opportunity.companyResearch = research;
}

export async function addStagePrep(
  opportunityId: string,
  stageType: StageType,
  stageLabel: string,
  content: StageContent,
  additionalContext: string | null,
  interviewerTitle: string | null,
  source: "live" | "mock"
): Promise<StagePrep> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("preps")
      .insert({
        opportunity_id: opportunityId,
        stage_type: stageType,
        stage_label: stageLabel,
        content,
        additional_context: additionalContext,
        interviewer_title: interviewerTitle,
        source,
      })
      .select()
      .single();
    if (error) throw new Error(`addStagePrep: ${error.message}`);
    return rowToPrep(data, []);
  }

  const prep: StagePrep = {
    id: randomUUID(),
    opportunityId,
    stageType,
    stageLabel,
    content,
    additionalContext,
    contextEntries: [],
    interviewerTitle,
    source,
    createdAt: new Date().toISOString(),
  };
  memoryDB().preps.unshift(prep);
  return prep;
}

// v6: overwrites an existing stage prep's content (and source) in place —
// used by the "Regenerate" trigger, which reruns Call 2 for a stage using
// its own current context log (see .../preps/[prepId]/regenerate). Leaves
// createdAt, additionalContext, interviewerTitle, and contextEntries
// untouched — this only replaces the generated content itself, same
// scoping as regenerate-research's overwrite of `company_research`.
export async function updateStagePrepContent(
  prepId: string,
  content: StageContent,
  source: "live" | "mock"
): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from("preps").update({ content, source }).eq("id", prepId);
    if (error) throw new Error(`updateStagePrepContent: ${error.message}`);
    return;
  }

  const prep = memoryDB().preps.find((p) => p.id === prepId);
  if (prep) {
    prep.content = content;
    prep.source = source;
  }
}

// v4: appends one entry to a stage's context log. Callers are responsible
// for enforcing the "only the most-recently-created stage accepts new
// entries" rule (see the context-entries route) — this function itself
// just inserts, same division of responsibility as the rest of store.ts.
export async function addContextEntry(stageId: string, body: string): Promise<ContextEntry> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("context_entries")
      .insert({ stage_id: stageId, body })
      .select()
      .single();
    if (error) throw new Error(`addContextEntry: ${error.message}`);
    return rowToContextEntry(data);
  }

  const entry: ContextEntry = {
    id: randomUUID(),
    stageId,
    body,
    createdAt: new Date().toISOString(),
  };
  memoryDB().contextEntries.push(entry);
  return entry;
}

// Shared across both users by design (see spec: a named 2-person tool, not
// multi-tenant). `applicant_name` stays on the record so the two users can
// tell their entries apart in the list, but it's not a filter — both
// people see the same opportunity list.
export async function listOpportunities(): Promise<OpportunitySummary[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*, preps(created_at, stage_label, interviewer_title)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listOpportunities: ${error.message}`);
    return (data ?? []).map((row) => {
      const preps = (row.preps ?? []) as {
        created_at: string;
        stage_label: string;
        interviewer_title: string | null;
      }[];
      const sorted = [...preps].sort((a, b) => a.created_at.localeCompare(b.created_at));
      const latest = sorted.at(-1);
      return {
        ...rowToOpportunity(row),
        latestPrepAt: latest?.created_at ?? null,
        stageCount: preps.length,
        latestStageLabel: latest?.stage_label ?? null,
        latestInterviewerTitle: latest?.interviewer_title ?? null,
      };
    });
  }

  return memoryDB().opportunities.map((o) => {
    const preps = memoryDB()
      .preps.filter((p) => p.opportunityId === o.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const latest = preps.at(-1);
    return {
      ...o,
      latestPrepAt: latest?.createdAt ?? null,
      stageCount: preps.length,
      latestStageLabel: latest?.stageLabel ?? null,
      latestInterviewerTitle: latest?.interviewerTitle ?? null,
    };
  });
}

// Deletes the opportunity and its preps. Supabase cascades via the FK
// (see src/lib/supabase/schema.sql "on delete cascade"); the in-memory
// store does the equivalent by hand. Returns false if nothing matched.
export async function deleteOpportunity(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { error, count } = await supabase
      .from("opportunities")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw new Error(`deleteOpportunity: ${error.message}`);
    return (count ?? 0) > 0;
  }

  const db = memoryDB();
  const before = db.opportunities.length;
  db.opportunities = db.opportunities.filter((o) => o.id !== id);
  db.preps = db.preps.filter((p) => p.opportunityId !== id);
  return db.opportunities.length < before;
}

export async function getOpportunity(id: string): Promise<OpportunityWithPreps | null> {
  const supabase = getSupabase();
  if (supabase) {
    const { data: oppRow, error: oppError } = await supabase
      .from("opportunities")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (oppError) throw new Error(`getOpportunity: ${oppError.message}`);
    if (!oppRow) return null;

    const { data: prepRows, error: prepError } = await supabase
      .from("preps")
      .select("*")
      .eq("opportunity_id", id)
      .order("created_at", { ascending: false });
    if (prepError) throw new Error(`getOpportunity preps: ${prepError.message}`);

    const prepIds = (prepRows ?? []).map((row) => row.id);
    const entriesByStage = new Map<string, ContextEntry[]>();
    if (prepIds.length > 0) {
      const { data: entryRows, error: entryError } = await supabase
        .from("context_entries")
        .select("*")
        .in("stage_id", prepIds)
        .order("created_at", { ascending: true });
      if (entryError) throw new Error(`getOpportunity context entries: ${entryError.message}`);
      for (const row of entryRows ?? []) {
        const entry = rowToContextEntry(row);
        const list = entriesByStage.get(entry.stageId) ?? [];
        list.push(entry);
        entriesByStage.set(entry.stageId, list);
      }
    }

    return {
      ...rowToOpportunity(oppRow),
      preps: (prepRows ?? []).map((row) => rowToPrep(row, entriesByStage.get(row.id) ?? [])),
    };
  }

  const opportunity = memoryDB().opportunities.find((o) => o.id === id);
  if (!opportunity) return null;
  const preps = memoryDB()
    .preps.filter((p) => p.opportunityId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({
      ...p,
      contextEntries: memoryDB()
        .contextEntries.filter((e) => e.stageId === p.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    }));
  return { ...opportunity, preps };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOpportunity(row: any): Opportunity {
  return {
    id: row.id,
    applicantName: row.applicant_name,
    company: row.company,
    role: row.role,
    jdText: row.jd_text,
    companyResearch: row.company_research ?? null,
    appliedDate: row.applied_date ?? null,
    additionalContext: row.additional_context ?? null,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPrep(row: any, contextEntries: ContextEntry[]): StagePrep {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    stageType: row.stage_type,
    stageLabel: row.stage_label,
    content: row.content,
    additionalContext: row.additional_context ?? null,
    contextEntries,
    interviewerTitle: row.interviewer_title ?? null,
    source: row.source,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToContextEntry(row: any): ContextEntry {
  return {
    id: row.id,
    stageId: row.stage_id,
    body: row.body,
    createdAt: row.created_at,
  };
}
