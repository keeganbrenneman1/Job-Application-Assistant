// Hard-coded example responses for cost-free manual iteration on the UI
// (see spec "Mock-to-live"). Not a general mock system — one fixed example
// per stage type, swapped in only via MOCK_MODE=true, all keyed to the
// same seeded Northline/Jordan Rivera sample data (src/lib/sample-data.ts).

import type { CompanyResearch, StageContent, StageType } from "@/types";

export const MOCK_RESEARCH: CompanyResearch = {
  basicInfo:
    "~180-person B2B logistics-software company, last raised a $40M Series C in early 2026.",
  recentNews:
    "Recent press covers a new warehouse-routing product line launched this spring.",
  culture:
    "Careers page and recent interviews emphasize a blunt, low-meeting operating style and a preference for shipping over process.",
  sources: ["https://example.com/press/series-c", "https://example.com/careers"],
};

const MOCK_STAGE_CONTENT: Record<StageType, StageContent> = {
  recruiter_screen: {
    fit:
      "Your text-analytics and CX background maps directly to their stated need for 'someone who can turn messy operational data into product decisions.' Your experience owning a mock-to-live extraction pipeline is a concrete, specific answer to their JD line about 'comfort with ambiguous, unstructured inputs.' Genuine stretch: the JD wants 5+ years PM experience and your platform-PM tenure is closer to 4 — have a direct answer ready, not a dodge.",
    expect:
      "Likely: 'Walk me through a time you shipped something under real constraints.' Frame with your iPad/free-tier build constraints as a live example of scoping under limits, not a hypothetical. Likely: 'Why platform PM, not product PM?' Have a clear one-line distinction ready, not an improvised one.",
    ask:
      "What does the platform team ship on its own versus in support of other product teams? What's the biggest thing that's slipped in the last two quarters, and why? What does a strong first 90 days look like from the hiring manager's side?",
    logistics:
      "Recruiter screens for this role have run 30 minutes historically. Confirm timezone for the panel round now, not later. Comp range not publicly listed — ask directly rather than guessing.",
  },
  technical_case: {
    fit:
      "Your SQL and API-mapping work at Fenwick Logistics is a direct answer to the JD's 'comfortable writing SQL and reading API docs directly' line. Weaker spot: nothing on your resume demonstrates schema design at scale — expect to be pressed on this rather than assumed competent at it.",
    topics:
      "Likely a take-home or whiteboard case on turning a messy operational data feed into a usable internal API — bring a framework for how you'd handle undocumented/inconsistent upstream schemas, not a finished design. Likely follow-up on how you'd prioritize platform reliability work against feature asks from downstream teams.",
    ask:
      "What does the current internal API's biggest reliability gap look like in practice? How is platform work prioritized against product-team feature requests today? Who owns the on-call rotation for platform incidents?",
    logistics:
      "Technical/case rounds at similarly staged companies often run 60-90 minutes — confirm format and whether it's live-coded or take-home in advance. Ask whether a laptop/tooling setup is required beforehand.",
  },
  behavioral: {
    stories:
      "Map your Meridian Health event-pipeline ownership to the JD's 'own the roadmap for platform reliability' line — that's your strongest STAR story here. Your Fenwick partner-API work maps to 'ambiguous, unstructured inputs.' Thinner ground: no resume evidence of a conflict-with-engineering story, which platform PM interviews often probe for directly.",
    questions:
      "Likely: 'Tell me about a time you disagreed with an engineer on scope.' STAR: pick a specific instance, be explicit about the actual disagreement, not a softened version. Likely: 'Describe a time a project failed or slipped.' Use the STAR frame but don't sand off the real cause — vague blame-free failure stories read as evasive in behavioral rounds.",
    ask:
      "What's an example of a recent disagreement on this team that got resolved well? How does the team handle a slipping roadmap item — renegotiate scope, or push the date? What's the most common reason platform initiatives stall here?",
    logistics:
      "Behavioral rounds for platform roles here typically run with the hiring manager solo, ~45 minutes. Have 3-4 stories ready, not just the strongest one — interviewers often ask for a second example on the spot.",
  },
  panel_onsite: {
    synthesis:
      "Across the recruiter screen and this panel, your consistent thread is hands-on ownership of messy data under real infra constraints — keep leading with that rather than re-introducing yourself generically to each panelist. The one gap flagged earlier (5+ years PM experience vs. your ~4) will likely resurface with at least one panelist; don't let the panel be the first time you address it head-on.",
    questions:
      "Engineering panelist: expect direct technical-tradeoff questions, e.g. build-vs-buy on the internal API layer. Hiring manager: likely repeats the 'why platform PM' framing question from the screen — don't recycle the same script word-for-word, they'll notice. Cross-functional partner (if present): expect questions about how you handle competing team priorities.",
    ask:
      "To the engineering panelist: what's the one platform decision from the last year you'd unwind if you could? To the hiring manager: how does success get evaluated at the 6-month mark specifically for this role? To a cross-functional partner: what's the current biggest friction point working with the platform team?",
    logistics:
      "Onsite/panel loops at this stage typically run half a day across 3-4 back-to-back conversations — confirm the schedule and build in a break if it isn't offered. Ask who's on each panel beforehand so you're not meeting names cold.",
  },
  reference_check: {
    emphasize:
      "Have references speak concretely to your ownership of the Meridian event pipeline and the Fenwick partner-API work — the two strongest, most JD-relevant threads from your resume. Don't leave the 5-years-vs-4 experience gap for a reference to stumble into unprepared; brief them on how you're framing it.",
    questions:
      "Likely: 'What would you say is their biggest growth area?' Make sure whoever you pick has a real, specific answer ready rather than a generic 'they're great' — a vague non-answer here reads worse than a real gap named plainly. Likely: 'Would you rehire them, and in what kind of role?'",
    logistics:
      "Confirm your references' availability and preferred contact method before listing them — a reference who's slow to respond can stall an otherwise-moving process. No 'questions to ask' section here since you won't be in the room for this stage.",
  },
  other: {
    fit:
      "Your text-analytics and CX background maps to their stated need for someone comfortable with ambiguous, unstructured inputs. Genuine stretch: confirm what this stage is actually assessing before assuming your strongest recruiter-screen talking points still apply as-is.",
    expect:
      "Without a named stage type, expect this round to blend elements of the earlier stages — fit, technical depth, and culture fit are all plausible. Have your strongest 2-3 stories ready rather than over-preparing one narrow angle.",
    ask:
      "What's the format of this particular round, and who will be in it? What does the team want to learn about you specifically at this point in the process? What happens after this stage?",
    logistics:
      "Confirm format, duration, and attendees ahead of time since the stage type wasn't specified — that avoids showing up prepared for the wrong kind of conversation.",
  },
};

export function mockStageContent(stageType: StageType): StageContent {
  return MOCK_STAGE_CONTENT[stageType];
}
