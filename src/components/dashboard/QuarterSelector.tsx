import { cn } from "@/lib/utils";

interface Transcript {
  name: string;
}

interface QuarterSelectorProps {
  transcripts: Transcript[];
  selectedTranscript: string | null;
  selectedTab: string;
  onSelectTranscript: (name: string) => void;
  onSelectAnalysis: () => void;
}

function formatTranscriptLabel(filename: string): string {
  if (!filename) return "";
  const match = filename.match(/q(\d)-(\d{4})/i);
  if (match) {
    const quarter = match[1];
    const year = match[2];
    return `Q${quarter} ${year}`;
  }
  return filename;
}

export function QuarterSelector({
  transcripts,
  selectedTranscript,
  selectedTab,
  onSelectTranscript,
  onSelectAnalysis,
}: QuarterSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/50 px-6 py-3">
      <span className="mr-2 text-sm font-medium text-muted-foreground">
        Quarter:
      </span>
      {transcripts.map((t) => {
        const isActive = selectedTab !== "analysis" && t.name === selectedTranscript;
        return (
          <button
            key={t.name}
            onClick={() => onSelectTranscript(t.name)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {formatTranscriptLabel(t.name)}
          </button>
        );
      })}
      <div className="ml-auto">
        <button
          onClick={onSelectAnalysis}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-all",
            selectedTab === "analysis"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Cross-Quarter Analysis
        </button>
      </div>
    </div>
  );
}
