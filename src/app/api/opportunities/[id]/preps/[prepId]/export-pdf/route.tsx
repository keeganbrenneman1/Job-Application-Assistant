import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getOpportunity } from "@/lib/store";
import { StagePrepDocument, buildExportFilename } from "@/lib/pdf/stage-prep-document";
import { STAGE_SECTIONS } from "@/types";

export const runtime = "nodejs";

// v7 "Export to PDF": renders one stage's prep doc as a standalone,
// downloadable PDF — that stage's generated content, plus the Company
// Snapshot only when the stage is a Recruiter Screen (see
// StagePrepDocument for why: every other stage type never shows it in the
// app either, generated once per opportunity, not per stage). No Claude
// call happens in this route at all — it only renders content that's
// already been generated and persisted — so none of the other routes'
// maxDuration=60 concerns apply here. Deliberately doesn't touch the
// stage's context log or the opportunity-level context field: both are
// working material that already fed Call 2's output, so they're already
// reflected in what this renders (see README's v7 entry).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; prepId: string }> }
) {
  const { id, prepId } = await params;

  try {
    const opportunity = await getOpportunity(id);
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }

    const prep = opportunity.preps.find((p) => p.id === prepId);
    if (!prep) {
      return NextResponse.json({ error: "Stage not found." }, { status: 404 });
    }

    const sections = STAGE_SECTIONS[prep.stageType];
    // Company Snapshot is generated once per opportunity, shown only on
    // Recruiter Screen in the app's own feed (see StagePrepCard) — same
    // rule applied here rather than exporting it for every stage type.
    const companyResearch = prep.stageType === "recruiter_screen" ? opportunity.companyResearch : null;

    const pdfBuffer = await renderToBuffer(
      <StagePrepDocument
        company={opportunity.company}
        role={opportunity.role}
        applicantName={opportunity.applicantName}
        prep={prep}
        sections={sections}
        companyResearch={companyResearch}
        generatedAt={new Date().toISOString()}
      />
    );

    const filename = buildExportFilename(opportunity.company, opportunity.role, prep);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("export prep pdf failed", err);
    const message = err instanceof Error ? err.message : "Failed to export PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
