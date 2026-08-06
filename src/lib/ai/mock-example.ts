// Hard-coded example response for cost-free manual iteration on the UI
// (see spec "Mock-to-live"). This is NOT a general mock system — it's one
// fixed example, swapped in only via MOCK_MODE=true.

import type { CompanyResearch, PrepContent } from "@/types";

export const MOCK_RESEARCH: CompanyResearch = {
  basicInfo:
    "~180-person B2B logistics-software company, last raised a $40M Series C in early 2026.",
  recentNews:
    "Recent press covers a new warehouse-routing product line launched this spring.",
  culture:
    "Careers page and recent interviews emphasize a blunt, low-meeting operating style and a preference for shipping over process.",
  sources: ["https://example.com/press/series-c", "https://example.com/careers"],
};

export const MOCK_CONTENT: PrepContent = {
  company:
    "Northline is a ~180-person B2B logistics-software company, last raised a $40M Series C in early 2026. Recent press covers a new warehouse-routing product line launched this spring. Culture signals from their careers page and recent interviews emphasize a blunt, low-meeting operating style and a preference for shipping over process.",
  fit:
    "Your text-analytics and CX background maps directly to their stated need for 'someone who can turn messy operational data into product decisions.' Your experience owning a mock-to-live extraction pipeline is a concrete, specific answer to their JD line about 'comfort with ambiguous, unstructured inputs.'",
  expect:
    "Likely: 'Walk me through a time you shipped something under real constraints.' Frame with your iPad/free-tier build constraints as a live example of scoping under limits, not a hypothetical. Likely: 'Why platform PM, not product PM?' Have a clear one-line distinction ready, not an improvised one.",
  ask:
    "What does the platform team ship on its own versus in support of other product teams? What's the biggest thing that's slipped in the last two quarters, and why? What does a strong first 90 days look like from the hiring manager's side?",
  logistics:
    "Recruiter screens for this role have run 30 minutes historically. Confirm timezone for the panel round now, not later. Comp range not publicly listed — ask directly rather than guessing.",
};
