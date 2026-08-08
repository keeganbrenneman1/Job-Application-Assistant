// Call 2 — Generation (reasoning only, no search tool). Takes the JD,
// Call 1's cached research, and (v2) prior-stage content + optional
// resume + optional additional context, and produces that stage's
// content only. Deliberately has no tool access — it must reason over the
// grounded facts it's given, not go fetch new ones (see spec
// "Grounding & architecture"). Never regenerates the Company Snapshot —
// that's Call 1's output, shown once per opportunity, not per stage.

import { getAnthropic, MODEL } from "@/lib/ai/client";
import { getFinalText, parseJsonResponse } from "@/lib/ai/json-response";
import type { CompanyResearch, StageContent, StageSectionDef } from "@/types";

const TONE_RULES = `Tone, throughout every section: candid over supportive. Do not default to encouraging or uniformly-positive language anywhere in the doc. This is a preparation tool, not reassurance — a candidate who walks in blind to a real weakness is worse off than one who saw it coming. Wherever the underlying material is genuinely mixed, uneven, or weak, say so plainly instead of softening it into vague positivity.`;

function buildSystemPrompt(
  stageLabel: string,
  sections: StageSectionDef[],
  hasResume: boolean,
  hasPriorStage: boolean
): string {
  const shape = sections.map((s) => `  "${s.key}": "string"`).join(",\n");
  const sectionGuidance = sections.map((s) => `- "${s.key}" (${s.label}): ${s.subtext}.`).join("\n");
  const resumeNote = hasResume
    ? ", plus their resume"
    : " (no resume was supplied this time — reason from the JD, the company research, and any resume-derived content already present in the prior-stage material, per the candidate's choice not to re-upload it)";
  const priorNote = hasPriorStage
    ? "the candidate's immediately preceding interview-stage prep"
    : "no prior-stage context (this is their first stage for this opportunity)";

  return `You are helping a job candidate prepare for a "${stageLabel}" interview stage. You will be given the job description, researched company facts, and ${priorNote}${resumeNote}. Produce a prep doc with exactly these sections, nothing more:

${sectionGuidance}

${TONE_RULES}

Rules:
- Never produce a "company" or company-snapshot section, under any key — that's handled separately and shown once per opportunity, not per stage.
- Ground every claim in what you were actually given (JD, research, resume if present, prior-stage content if present, additional context if present) — no invented specifics.
- Where a section calls for likely questions or topics, give short frameworks for answering, not scripted answers or solved problems.
- If additional context was supplied for this stage, let it visibly shape the output rather than treating it as decoration.
- If prior-stage content was supplied, stay visibly continuous with it — no contradictions if placed side by side.
- Keep each section to 2-5 sentences, written for someone scanning right before this stage.

Respond with ONLY a JSON object (no markdown fences, no commentary) matching exactly this shape:
{
${shape}
}`;
}

export interface PriorStageContext {
  stageLabel: string;
  content: StageContent;
}

export async function generateStagePrepContent(params: {
  stageLabel: string;
  sections: StageSectionDef[];
  company: string;
  role: string;
  jdText: string;
  research: CompanyResearch;
  resumeText: string | null;
  priorStage: PriorStageContext | null;
  additionalContext: string | null;
}): Promise<StageContent> {
  const { stageLabel, sections, company, role, jdText, research, resumeText, priorStage, additionalContext } =
    params;

  const anthropic = getAnthropic();
  const systemPrompt = buildSystemPrompt(stageLabel, sections, Boolean(resumeText), Boolean(priorStage));

  const parts = [
    `Company: ${company}`,
    `Role: ${role}`,
    `Stage: ${stageLabel}`,
    ``,
    `--- COMPANY RESEARCH (cached from Call 1, for context only — do not repeat as a section) ---`,
    `Basic info: ${research.basicInfo}`,
    `Recent news: ${research.recentNews}`,
    `Culture: ${research.culture}`,
    ``,
    `--- JOB DESCRIPTION ---`,
    jdText,
  ];

  if (resumeText) {
    parts.push(``, `--- RESUME ---`, resumeText);
  }

  if (priorStage) {
    parts.push(
      ``,
      `--- PRIOR STAGE: ${priorStage.stageLabel} ---`,
      JSON.stringify(priorStage.content, null, 2)
    );
  }

  if (additionalContext?.trim()) {
    parts.push(``, `--- ADDITIONAL CONTEXT FOR THIS STAGE ---`, additionalContext.trim());
  }

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: "user", content: parts.join("\n") }],
  });

  const text = getFinalText(message.content);
  const parsed = parseJsonResponse<Record<string, string>>(text, "Generation call", message.stop_reason);

  const content: StageContent = {};
  for (const section of sections) {
    content[section.key] = parsed[section.key] || "";
  }
  return content;
}
