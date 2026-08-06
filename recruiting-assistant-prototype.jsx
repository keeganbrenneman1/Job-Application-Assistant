import { useState } from "react";
import { ChevronDown, FolderOpen, FilePlus, Building2, Target, HelpCircle, MessageSquareText, ClipboardList, User } from "lucide-react";

const theme = {
  ink: "#12141A",
  panel: "#1B1E25",
  panelRaised: "#22262F",
  rule: "#2E323C",
  paper: "#EDEAE2",
  paperMuted: "#9A9DA6",
  brass: "#B8923F",
  brassDim: "#8A6E30",
  signal: "#5B8C87",
};

const SECTIONS = [
  { code: "01", key: "company", label: "Company", icon: Building2 },
  { code: "02", key: "fit", label: "Fit", icon: Target },
  { code: "03", key: "expect", label: "Expect", icon: HelpCircle },
  { code: "04", key: "ask", label: "Ask", icon: MessageSquareText },
  { code: "05", key: "logistics", label: "Logistics", icon: ClipboardList },
];

const MOCK_PREP = {
  company: "Northline",
  role: "Senior Product Manager, Platform",
  generatedAt: "Aug 6",
  content: {
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
  },
};

const MOCK_ARCHIVE = [
  { id: 1, company: "Northline", role: "Senior Product Manager, Platform", date: "Aug 6" },
  { id: 2, company: "Basecamp Freight", role: "Group Product Manager", date: "Jul 29" },
];

function Chrome({ profile, setProfile, view, setView, children }) {
  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: theme.ink, color: theme.paper }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');`}</style>
      <header
        className="flex items-center justify-between px-5 py-4 border-b"
        style={{ borderColor: theme.rule, background: theme.panel }}
      >
        <div className="flex items-baseline gap-2">
          <span style={{ fontFamily: "Fraunces, serif" }} className="text-lg tracking-tight">
            Interview Prep
          </span>
          <span className="text-xs" style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}>
            recruiter screen
          </span>
        </div>
        <button
          onClick={() => setProfile(profile === "Keegan" ? "Spouse" : "Keegan")}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border"
          style={{ borderColor: theme.rule, color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}
        >
          <User size={13} />
          {profile}
        </button>
      </header>

      <nav className="flex border-b" style={{ borderColor: theme.rule, background: theme.panel }}>
        {[
          { key: "new", label: "New Prep", icon: FilePlus },
          { key: "archive", label: "Opportunities", icon: FolderOpen },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs"
            style={{
              fontFamily: "IBM Plex Sans, sans-serif",
              color: view === tab.key ? theme.brass : theme.paperMuted,
              borderBottom: view === tab.key ? `2px solid ${theme.brass}` : "2px solid transparent",
            }}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 px-5 py-6 max-w-xl w-full mx-auto">{children}</main>
    </div>
  );
}

function NewPrepForm({ onGenerate }) {
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onGenerate();
    }, 900);
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label
          className="text-xs uppercase tracking-wide block mb-1.5"
          style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}
        >
          Job description
        </label>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          placeholder="Paste the JD, or paste a URL to scrape"
          rows={5}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={{
            background: theme.panelRaised,
            border: `1px solid ${theme.rule}`,
            color: theme.paper,
            fontFamily: "IBM Plex Sans, sans-serif",
          }}
        />
      </div>

      <div>
        <label
          className="text-xs uppercase tracking-wide block mb-1.5"
          style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}
        >
          Resume
        </label>
        <textarea
          value={resume}
          onChange={(e) => setResume(e.target.value)}
          placeholder="Paste resume text, or upload a PDF/DOCX"
          rows={5}
          className="w-full px-3 py-2.5 text-sm outline-none"
          style={{
            background: theme.panelRaised,
            border: `1px solid ${theme.rule}`,
            color: theme.paper,
            fontFamily: "IBM Plex Sans, sans-serif",
          }}
        />
        <p className="text-[11px] mt-1.5" style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}>
          Not stored — used once for this prep, then discarded.
        </p>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="text-sm py-2.5 mt-1 tracking-wide"
        style={{
          background: theme.brass,
          color: theme.ink,
          fontFamily: "IBM Plex Sans, sans-serif",
          fontWeight: 600,
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? "Researching & generating…" : "Generate prep doc"}
      </button>
    </div>
  );
}

function DossierDoc({ prep }) {
  const [open, setOpen] = useState("company");

  return (
    <div>
      <div className="mb-5">
        <div className="text-[11px] tracking-wide" style={{ color: theme.brass, fontFamily: "IBM Plex Sans, sans-serif" }}>
          {prep.generatedAt}
        </div>
        <h1 style={{ fontFamily: "Fraunces, serif" }} className="text-2xl mt-0.5">
          {prep.company}
        </h1>
        <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}>
          {prep.role}
        </p>
      </div>

      <div className="border" style={{ borderColor: theme.rule }}>
        {SECTIONS.map((s, i) => {
          const isOpen = open === s.key;
          const Icon = s.icon;
          return (
            <div key={s.key} style={{ borderTop: i === 0 ? "none" : `1px solid ${theme.rule}` }}>
              <button
                onClick={() => setOpen(isOpen ? null : s.key)}
                className="w-full flex items-center justify-between px-3.5 py-3"
                style={{ background: isOpen ? theme.panelRaised : "transparent" }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="text-[10px]"
                    style={{ color: isOpen ? theme.brass : theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}
                  >
                    {s.code}
                  </span>
                  <Icon size={14} color={isOpen ? theme.brass : theme.paperMuted} />
                  <span
                    className="text-sm"
                    style={{ fontFamily: "IBM Plex Sans, sans-serif", fontWeight: 500, color: theme.paper }}
                  >
                    {s.label}
                  </span>
                </div>
                <ChevronDown
                  size={15}
                  color={theme.paperMuted}
                  style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 120ms" }}
                />
              </button>
              {isOpen && (
                <div
                  className="px-3.5 pb-4 text-sm leading-relaxed"
                  style={{ color: theme.paper, fontFamily: "IBM Plex Sans, sans-serif", opacity: 0.92 }}
                >
                  {prep.content[s.key]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Archive({ items, onOpen }) {
  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}>
        No opportunities yet. Generate a prep doc and it'll show up here.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onOpen(item)}
          className="flex items-center justify-between px-3.5 py-3 border text-left"
          style={{ borderColor: theme.rule, background: theme.panel }}
        >
          <div>
            <div style={{ fontFamily: "Fraunces, serif" }} className="text-base">
              {item.company}
            </div>
            <div className="text-xs" style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}>
              {item.role}
            </div>
          </div>
          <span className="text-[11px]" style={{ color: theme.paperMuted, fontFamily: "IBM Plex Sans, sans-serif" }}>
            {item.date}
          </span>
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [profile, setProfile] = useState("Keegan");
  const [view, setView] = useState("new");
  const [archive, setArchive] = useState(MOCK_ARCHIVE);
  const [activePrep, setActivePrep] = useState(null);

  const handleGenerate = () => {
    setArchive((prev) => [
      { id: Date.now(), company: MOCK_PREP.company, role: MOCK_PREP.role, date: MOCK_PREP.generatedAt },
      ...prev,
    ]);
    setActivePrep(MOCK_PREP);
  };

  const handleOpenOpportunity = () => {
    setActivePrep(MOCK_PREP);
  };

  return (
    <Chrome profile={profile} setProfile={setProfile} view={view} setView={setView}>
      {activePrep ? (
        <div>
          <button
            onClick={() => setActivePrep(null)}
            className="text-xs mb-4"
            style={{ color: theme.signal, fontFamily: "IBM Plex Sans, sans-serif" }}
          >
            ← back
          </button>
          <DossierDoc prep={activePrep} />
        </div>
      ) : view === "new" ? (
        <NewPrepForm onGenerate={handleGenerate} />
      ) : (
        <Archive items={archive} onOpen={handleOpenOpportunity} />
      )}
    </Chrome>
  );
}
