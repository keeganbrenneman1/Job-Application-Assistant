import { randomUUID } from "crypto";
import { getSupabase } from "@/lib/supabase/client";
import type {
  CompanyResearch,
  Opportunity,
  OpportunitySummary,
  OpportunityWithPreps,
  Prep,
  PrepContent,
  Profile,
} from "@/types";

// Persistence for opportunities + preps. Backed by Supabase when
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are configured (see
// src/lib/supabase/schema.sql). Falls back to an in-memory store when they
// aren't, so `npm run dev` is usable end-to-end in a fresh Codespace before
// a Supabase project is provisioned. The in-memory store resets on every
// server restart and is not suitable for anything beyond local iteration.

interface MemoryDB {
  opportunities: Opportunity[];
  preps: Prep[];
}

const globalForMemory = globalThis as unknown as { __jaaMemoryDB?: MemoryDB };

function memoryDB(): MemoryDB {
  if (!globalForMemory.__jaaMemoryDB) {
    globalForMemory.__jaaMemoryDB = { opportunities: [], preps: [] };
  }
  return globalForMemory.__jaaMemoryDB;
}

export async function createOpportunity(
  owner: Profile,
  company: string,
  role: string
): Promise<Opportunity> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("opportunities")
      .insert({ owner, company, role })
      .select()
      .single();
    if (error) throw new Error(`createOpportunity: ${error.message}`);
    return rowToOpportunity(data);
  }

  const opportunity: Opportunity = {
    id: randomUUID(),
    owner,
    company,
    role,
    createdAt: new Date().toISOString(),
  };
  memoryDB().opportunities.unshift(opportunity);
  return opportunity;
}

export async function addPrep(
  opportunityId: string,
  content: PrepContent,
  research: CompanyResearch | null,
  source: "live" | "mock"
): Promise<Prep> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("preps")
      .insert({ opportunity_id: opportunityId, content, research, source })
      .select()
      .single();
    if (error) throw new Error(`addPrep: ${error.message}`);
    return rowToPrep(data);
  }

  const prep: Prep = {
    id: randomUUID(),
    opportunityId,
    content,
    research,
    source,
    createdAt: new Date().toISOString(),
  };
  memoryDB().preps.unshift(prep);
  return prep;
}

// Shared across both profiles by design (see job-assistant-spec.md: a
// named 2-person tool, not multi-tenant). `owner` stays on the record to
// track who generated each prep, but it's not a filter — both people see
// the same opportunity list.
export async function listOpportunities(): Promise<OpportunitySummary[]> {
  const supabase = getSupabase();
  if (supabase) {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*, preps(created_at)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`listOpportunities: ${error.message}`);
    return (data ?? []).map((row) => {
      const preps = (row.preps ?? []) as { created_at: string }[];
      const latest = preps
        .map((p) => p.created_at)
        .sort()
        .at(-1);
      return { ...rowToOpportunity(row), latestPrepAt: latest ?? null };
    });
  }

  return memoryDB()
    .opportunities.map((o) => {
      const latest = memoryDB()
        .preps.filter((p) => p.opportunityId === o.id)
        .map((p) => p.createdAt)
        .sort()
        .at(-1);
      return { ...o, latestPrepAt: latest ?? null };
    });
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

    return { ...rowToOpportunity(oppRow), preps: (prepRows ?? []).map(rowToPrep) };
  }

  const opportunity = memoryDB().opportunities.find((o) => o.id === id);
  if (!opportunity) return null;
  const preps = memoryDB()
    .preps.filter((p) => p.opportunityId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...opportunity, preps };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOpportunity(row: any): Opportunity {
  return {
    id: row.id,
    owner: row.owner,
    company: row.company,
    role: row.role,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPrep(row: any): Prep {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    content: row.content,
    research: row.research ?? null,
    source: row.source,
    createdAt: row.created_at,
  };
}
