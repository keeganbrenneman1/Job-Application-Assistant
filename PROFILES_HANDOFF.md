# Profiles (v9/v10) — Handoff

Session notes for whoever picks up profile-related work next — a fresh Claude session
or Keegan himself — since a few of the decisions below aren't obvious from the code or
the README alone. Short on purpose: unlike `V3_HANDOFF.md`, this feature had no live
bugs and no hard platform constraint forcing an architecture. Read this before touching
profiles further, especially before touching the roadmap's "Resume recommendations from
outcomes" item.

## What shipped

- **v9** — `profiles` table (`id`, `name`, `resume_text`, `created_at`) and a nullable
  `opportunities.profile_id`. Optional selector on the New Opportunity form (prefills
  name + resume, both stay editable). Post-submit "Save as profile?" banner, shown only
  when `profile_id` was null on submit and both name and resume were typed manually.
- **v10** — Profiles tab: sortable table (name/resume/created), a "New Profile" form
  (name required, resume optional), delete per row. `profile_id`'s FK changed to
  `on delete set null`.

## Decisions worth knowing (not otherwise written down)

**The roadmap's "Resume profiles" item split cleanly, and only half is done.** The
original v-next bullet had two dependent parts: "opt-in resume storage for reuse" and
"resume recommendations from outcomes," both explicitly gated on a future per-user
identity/attribution mechanism (see README "What's not built yet"). v9 built the first
half *without* that mechanism after all — profiles turned out not to need per-user
identity, just an opt-in, unauthenticated, shared-across-both-users table, same trust
model as everything else in the app. The second half (suggesting resume refinements
from a user's own closed-opportunity outcomes) genuinely still needs identity, for a
different reason: it has to reason over *one user's* outcomes specifically, not just
store a name + resume. Don't assume identity is now unblocked in general because the
first half shipped without it — re-read the README's current roadmap wording for the
precise scope of what's still blocked before starting outcome-based recommendations.

**The FK is `on delete set null`, not restrict or cascade — deliberately.** Restrict
would make deleting a profile fail with a foreign-key error the UI would have to
surface awkwardly. Cascade would delete opportunities, which is never wanted — an
opportunity's own data (`applicant_name`, `jd_text`, generated preps) is independent of
whatever profile it was created from. `set null` un-links cleanly: the opportunity
keeps everything it has, `profile_id` just reverts to null, same as if it had never
been linked. If a future change adds more FKs to `profiles`, default to the same
reasoning rather than restrict/cascade.

**Two profile-creation paths exist on purpose, with different validation.** The
save-as-profile prompt (v9, tied to an opportunity) requires both name and resume
non-empty — partial data there would create a profile the user didn't really ask to
save. The Profiles tab's "New Profile" form (v10, standalone) only requires a name —
resume is optional, since there's no opportunity's already-typed data driving the
default there, and forcing a resume up front would block saving a name-only profile to
fill in later. If you unify or refactor profile creation, keep this asymmetry
intentional rather than "fixing" it to one shared validation rule.

**No edit path is a scope choice, not an oversight.** Delete + recreate is the only way
to fix a typo or swap a resume, matching "smallest real fix" scope. If asked to add
inline editing, it's a new `PATCH /api/profiles/[id]` route plus form — straightforward,
just not built.

**`schema.sql` doesn't run itself.** Every Supabase schema change in this repo
(profiles included) requires manually pasting `src/lib/supabase/schema.sql` into the
Supabase SQL Editor and running it — there's no migration-on-deploy step. This already
tripped up a real session (the `createProfile: Could not find the table 'public.profiles'
in the schema cache` error) after v9/v10 merged but before the SQL had been run against
the live project. This is expected, not a bug — see the README's "Running locally"
section, which documents the same error message and fix.

## What's still open

Everything in this area beyond the two shipped versions is exactly what the README's
roadmap already says: no login/auth, no per-user siloing, no backfill, no resume
parsing/matching, no edit path — and "resume recommendations from outcomes" stays
blocked on per-user identity per the note above. Nothing here is a hidden TODO; it's
all deliberate, already-documented scope.
