// Shared style constants for the app's form components (NewPrepForm,
// LogAppliedForm, FirstPrepForm, NextStepForm, and the input fields they
// compose) — pulled out once several forms started repeating the same
// three declarations verbatim.
import { theme, sansFont } from "@/lib/theme";

export const inputStyle = {
  background: theme.panelRaised,
  border: `1px solid ${theme.rule}`,
  color: theme.paper,
  fontFamily: sansFont,
};

export const labelClass = "text-xs uppercase tracking-wide block mb-1.5";
export const labelStyle = { color: theme.paperMuted, fontFamily: sansFont };
