# v3 → v4/v5 Handoff

Session notes from the v3 build (persistent opportunity-level context) and everything
that grew out of it. Written for whoever picks up v4/v5 next — a fresh Claude session
or Keegan himself — since most of the reasoning below isn't visible from the code or
the README alone. Read this after the README's "What's not built yet" section and
before touching v4/v5.

## What shipped

Seven PRs, in order, each merged before the next began:

1. **v3 core** — `additional_context` (text, nullable) on `opportunities`; new
   collapsible "Additional Context" section on the Opportunity Detail page, pre-filled
   and editable in place; folded into Call 2's prompt whenever non-empty, in its own
   labeled block distinct from the per-stage context field. No new Claude call, no
   schema beyond that one column — exactly the brief.
2. **Company Snapshot Regenerate** — a v-next item pulled forward mid-session after a
   live bug: re-runs Call 1 only, overwrites the opportunity's cached research.
   Deliberately scoped to research only, not a stage prep — see "Decisions" below for
   why this stayed separate from "re-request prep doc."
3. **Regenerate hang diagnostics** — a `console.log` at the top of the
   `regenerate-research` handler, plus a client-side abort timeout, added to
   investigate a reported silent hang with nothing in Vercel's logs.
4. **`maxDuration=60`** on every route that calls Claude — the diagnostics confirmed a
   request was reaching the function and then going silent, consistent with a hard
   platform-level kill that bypasses the route's own error handling.
5. **Additional Context on New Opportunity** — closed a real gap: the one-shot "New
   Opportunity" flow had no record to attach v3's field to until after generation
   already ran. Now travels in on the request body itself.
6. **Split research + generation into separate requests** — the real fix for Vercel
   Hobby timeouts (see "Constraints" below). `/api/generate` is now creation-only;
   research and generation each run as their own request.
7. **`getFinalText` fix** — the actual root cause of "Company Snapshot shows 'Not
   found.'", found by reasoning about the code once the timeout theory was ruled out.
   See "Decisions" below — this is the one deliberate exception to the original
   brief's "no changes to Call 0 or Call 1," and it was a live, reproducible bug the
   user found and directed fixing at each step, not unprompted scope creep.

## Decisions worth knowing (not otherwise written down)

**Company Snapshot Regenerate vs. "re-request prep doc" are deliberately two
features, not one.** They map to different calls (Call 1 vs. Call 2), different
scopes (the whole opportunity vs. one stage), and bundling them would mean every
stage regen silently re-runs research — contradicting the v2 spec's firm requirement
that research is cached once per opportunity and reused across stages. The original
v-next bullet covered both cases together; splitting them was a judgment call made
explicitly with the user, not implied by the spec.

**The Hobby-plan timeout was two independent bugs, not one causing the other.**
Call 1's web-search loop was always slow enough to approach Vercel's duration limit
— that's a property of the task, unrelated to any bug. Separately, `getFinalText`
was silently dropping content that landed in a non-final text block. Fixing the
timeout (splitting requests, `maxDuration=60`) did not cause the "Not found." bug,
and fixing "Not found." (concatenating all text blocks) does not add any latency —
the Anthropic API call doesn't return until Claude has finished generating
everything regardless of how the response is parsed afterward. Don't assume one fix
explains the other if something else surfaces later.

**Vercel Hobby plan is a firm constraint, not a temporary one.** Explicitly discussed
and decided: no upgrade to Pro to buy more `maxDuration` headroom, even though that
would have been the one-line fix. The user's reasoning: paying more to "kick the can
down the road" on a project still being validated isn't worth it. Any future work
that adds or changes a Claude-calling route must fit its own request inside a single
Call-1-or-Call-2 budget under 60s — do not reintroduce a route that chains two Claude
calls sequentially in one request.

## Constraints for v4/v5 to respect

- **60s hard ceiling, per request, on every route that calls Claude.** The pattern
  established this session: one request = one Claude call, orchestrated client-side
  as separate sequential requests when a flow needs more than one (see
  `src/app/page.tsx`'s `runResearch()` helper and the `handleGenerate` /
  `handleGenerateFirstPrep` staged-progress pattern). Follow this pattern for any new
  multi-call flow rather than combining calls in one route.
- **`getFinalText` (`src/lib/ai/response-text.ts`) now concatenates every text block**
  in a response instead of taking only the last one. This matters for any future
  Claude call that adds a tool (currently only Call 1 does). If a new tool-using call
  gets added, re-verify this assumption still holds rather than assuming it's a
  solved problem.
- **`first-prep` (`src/app/api/opportunities/[id]/first-prep/route.ts`) has two call
  sites depending on two different states**: research already cached (skips Call 1)
  or not (runs both calls itself, standalone). Both paths are load-bearing — Log
  Applied's fast path relies on the first, direct/backward-compatible use relies on
  the second. Preserve both if this route changes again.
- **Resume text is never persisted, anywhere, at any stage.** This is a hard
  invariant, not a preference — it shaped the request-splitting design directly
  (resume has to stay client-side across a multi-step flow rather than round-trip
  through the database). Any v4/v5 work involving resume content must keep this true.
- **PRs on this repo tend to merge fast, often within the same session.** A feature
  branch frequently needs restarting from `main` mid-session
  (`git checkout -B <branch> origin/main`, carrying forward any unmerged commits)
  rather than being reused across a long string of pushes. Expect this, not a
  "stale info" push rejection as a signal something's wrong.

## Where these land for v4 and v5 specifically

**v4 (per-stage context becomes an append-only log):** needs a new
`context_entries` table keyed to a stage, per the README's own note — not new
columns on `preps`. `src/components/OpportunityContext.tsx` (v3's running-note field)
is a reasonable UI reference for "pre-filled, editable, feels like a running note,"
but v4's log is entry-additive, not edit-in-place — expect a genuinely different
component, not a copy. v3's opportunity-level field is explicitly unaffected;
confirm nothing in v4 touches it.

**v5 (remove the 2-stage cap):** the cap itself is enforced in one place —
`next-step/route.ts`'s `if (opportunity.preps.length !== 1)` check. The harder part
is `PriorStageContext` (`src/lib/ai/generate.ts`) currently only carries one prior
stage's raw content; naively extending that to N stages reintroduces the context/cost
ballooning the original v1 spec flagged. The README already specifies the intended
mechanism — a rolling summary, rewritten after each stage generation, stored on the
opportunity, not full raw text per prior stage — that's the piece to design, not the
cap removal itself.

## Suggested reading order for the next session

1. `AGENTS.md` / `CLAUDE.md` (auto-loaded)
2. `README.md`, especially "What's not built yet"
3. This file
4. `JOB_APPLICATION_ASSISTANT_SPEC.md` (v2, locked architecture decisions)
5. Whichever of v4/v5 is being picked up, in the README
