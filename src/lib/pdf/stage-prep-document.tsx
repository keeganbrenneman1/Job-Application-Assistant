// v7 "Export to PDF": a standalone, printable rendering of one stage's
// prep doc — see the .../preps/[prepId]/export-pdf route, the only caller.
// Deliberately excludes the stage's context log and the opportunity-level
// context field: both are working material that already fed Call 2's
// output, so re-showing them here would just duplicate what's already
// reflected in the sections below (see README's v7 entry). Uses only the
// 14 standard PDF fonts (Times/Helvetica) — no Font.register, no network
// fetch at render time, so this never depends on an external font host
// being reachable from wherever the route runs.

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { CompanyResearch, StageSectionDef, StagePrep } from "@/types";

const INK = "#1A1A1A";
const BODY = "#2A2A2A";
const MUTED = "#6B6E76";
const RULE = "#D9D6CC";
const SIGNAL = "#3E6864";
const PAPER_TINT = "#F5F3EC";

// Deliberately no `lineHeight` here on `page` — @react-pdf/renderer silently
// drops `fixed`-positioned children (the footer below) when `lineHeight` is
// set on the Page style itself, even though every other style property is
// unaffected. `lineHeight` lives on `paragraph` instead, scoped to the body
// text that actually needs the relaxed spacing. Confirmed by isolating the
// footer in a minimal reproduction — don't move this back onto `page`.
const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 52,
    fontSize: 10.5,
    fontFamily: "Helvetica",
    color: BODY,
  },
  eyebrow: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8.5,
    color: MUTED,
    marginBottom: 16,
  },
  title: {
    fontFamily: "Times-Bold",
    fontSize: 22,
    color: INK,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Helvetica",
    fontSize: 11,
    color: MUTED,
    marginBottom: 2,
  },
  metaRow: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: MUTED,
    marginBottom: 18,
  },
  headerRule: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginBottom: 20,
  },
  snapshotBox: {
    backgroundColor: PAPER_TINT,
    borderRadius: 3,
    padding: 16,
    marginBottom: 22,
  },
  snapshotHeading: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: INK,
    marginBottom: 2,
  },
  provenance: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8.5,
    color: SIGNAL,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: BODY,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  sourcesLine: {
    fontFamily: "Helvetica",
    fontSize: 8,
    color: MUTED,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontFamily: "Times-Bold",
    fontSize: 13,
    color: INK,
    marginBottom: 2,
  },
  sectionSubtext: {
    fontFamily: "Helvetica-Oblique",
    fontSize: 8.5,
    color: MUTED,
    marginBottom: 3,
  },
  sectionRule: {
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    marginTop: 14,
    marginBottom: 2,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    fontFamily: "Helvetica",
    fontSize: 8,
    color: MUTED,
    borderTopWidth: 1,
    borderTopColor: RULE,
    paddingTop: 8,
  },
});

export interface StagePrepPdfProps {
  company: string;
  role: string;
  applicantName: string;
  prep: StagePrep;
  sections: StageSectionDef[];
  // Only passed for a Recruiter Screen stage — see the export-pdf route,
  // which is the one place that decides whether to include it at all.
  companyResearch: CompanyResearch | null;
  generatedAt: string; // ISO timestamp, for the footer's "exported" date
}

export function StagePrepDocument({
  company,
  role,
  applicantName,
  prep,
  sections,
  companyResearch,
  generatedAt,
}: StagePrepPdfProps) {
  const dateOpts: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
  const stageDate = new Date(prep.createdAt).toLocaleDateString(undefined, dateOpts);
  const exportDate = new Date(generatedAt).toLocaleDateString(undefined, dateOpts);

  return (
    <Document title={`${prep.stageLabel} prep — ${company}`} author={applicantName} creator="Job Application Assistant">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.eyebrow}>A starting point, not a replacement for the original posting.</Text>
        <Text style={styles.title}>{prep.stageLabel} Prep</Text>
        <Text style={styles.subtitle}>
          {role} · {company}
        </Text>
        <Text style={styles.metaRow}>
          {applicantName} · Prepared {stageDate}
          {prep.interviewerTitle ? ` · Interviewer: ${prep.interviewerTitle}` : ""}
        </Text>
        <View style={styles.headerRule} />

        {companyResearch && (
          <View style={styles.snapshotBox}>
            <Text style={styles.snapshotHeading}>Company Snapshot</Text>
            <Text style={styles.provenance}>From live research — verify independently</Text>
            <Text style={styles.paragraph}>{companyResearch.basicInfo}</Text>
            <Text style={styles.paragraph}>{companyResearch.recentNews}</Text>
            <Text style={styles.paragraph}>{companyResearch.culture}</Text>
            {companyResearch.sources.length > 0 && (
              <Text style={styles.sourcesLine}>Sources: {companyResearch.sources.join(", ")}</Text>
            )}
          </View>
        )}

        {sections.map((s, i) => (
          <View key={s.key} style={styles.section}>
            <Text style={styles.sectionHeading}>{s.label}</Text>
            <Text style={styles.sectionSubtext}>{s.subtext}</Text>
            <Text style={styles.provenance}>{s.provenance}</Text>
            <Text style={styles.paragraph}>{prep.content[s.key] ?? ""}</Text>
            {i < sections.length - 1 && <View style={styles.sectionRule} />}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Job Application Assistant — exported {exportDate}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

// Builds a safe, ASCII-only download filename from free-text fields that
// may contain anything (unicode, punctuation, slashes) — sidesteps needing
// RFC 5987 filename* encoding in the Content-Disposition header.
export function buildExportFilename(company: string, role: string, prep: StagePrep): string {
  const slug = (value: string) =>
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  const parts = [slug(company), slug(role), slug(prep.stageLabel)].filter(Boolean);
  return `${parts.length > 0 ? parts.join("-") : "prep"}.pdf`;
}
