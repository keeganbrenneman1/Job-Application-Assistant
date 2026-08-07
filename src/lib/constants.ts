// Hard-coded for v1 (recruiter screen is the only stage). v2 adds more
// stages across the same prep-doc pattern (see JOB APPLICATION ASSISTANT SPEC.md
// v1/v2/v-next) — this is what starts varying per opportunity once that
// lands. Deliberately not a persisted DB column: the spec still scopes
// v1 as "no status/stage field" (no per-opportunity state to track yet),
// so this stays a display-only label shared by the dossier header and
// the opportunities table, not a schema/data-model addition.
export const STAGE_LABEL = "Recruiter Screen Prep";
