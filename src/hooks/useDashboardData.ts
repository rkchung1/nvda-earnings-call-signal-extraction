import { useState, useEffect, useCallback } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

interface Transcript {
  name: string;
}

interface SentimentEntry {
  file: string;
  management_scores?: SentimentScores;
  management?: SentimentScores;
  qa_scores?: SentimentScores;
  qa?: SentimentScores;
}

interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

interface SectionData {
  quarters: string[];
  positive: number[];
  neutral: number[];
  negative: number[];
  net_sentiment: number[];
}

interface QuarterlyPricePoint {
  date: string;
  adjusted_close: number;
}

interface QuarterlyPriceQuarter {
  name: string;
  start: string;
  end: string;
  points: QuarterlyPricePoint[];
}

interface QuarterlyPriceData {
  symbol: string;
  fiscal_year: number;
  quarters: QuarterlyPriceQuarter[];
}

interface QuarterlyShiftData {
  management: SectionData;
  qa: SectionData;
}

interface StrategicFocus {
  theme: string;
  summary: string;
}

interface QuarterlyShiftSummary {
  filename: string;
  content: string;
}

export function useDashboardData() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);

  const [sentiment, setSentiment] = useState<SentimentEntry[] | null>(null);
  const [strategicFocuses, setStrategicFocuses] = useState<Record<string, StrategicFocus[]> | null>(null);
  const [quarterlyShift, setQuarterlyShift] = useState<QuarterlyShiftData | null>(null);
  const [quarterlyShiftSummary, setQuarterlyShiftSummary] = useState<QuarterlyShiftSummary | null>(null);
  const [quarterlyPrices, setQuarterlyPrices] = useState<QuarterlyPriceData | null>(null);

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<string | null>(null);
  const [managementTranscriptContent, setManagementTranscriptContent] = useState("");
  const [qaTranscriptContent, setQaTranscriptContent] = useState("");
  const [selectedTopTab, setSelectedTopTab] = useState("transcript");

  const runPipeline = async () => {
    setIsRefreshing(true);
    setError(null);
    setPipelineStatus("Starting pipeline...");
    setIsPollingStatus(false);

    try {
      const res = await fetch(`${API_BASE}/pipeline/refresh`, { method: "POST" });
      if (!res.ok) {
        throw new Error(`Pipeline error: ${res.status}`);
      }
      setIsPollingStatus(true);
    } catch (e: any) {
      const message = e.message || "Failed to start pipeline";
      setError(message);
      setPipelineStatus(`Pipeline failed: ${message}`);
      setIsPollingStatus(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadSentiment = async () => {
    const res = await fetch(`${API_BASE}/sentiment`);
    if (!res.ok) throw new Error("Failed to load sentiment");
    const data = await res.json();
    setSentiment(data);
  };

  const loadStrategicFocuses = async () => {
    const res = await fetch(`${API_BASE}/strategic_focuses`);
    if (!res.ok) throw new Error("Failed to load strategic focuses");
    const data = await res.json();
    setStrategicFocuses(data);
  };

  const loadQuarterlyShift = async () => {
    const res = await fetch(`${API_BASE}/quarterly_shift`);
    if (!res.ok) throw new Error("Failed to load quarterly shift");
    const data = await res.json();
    setQuarterlyShift(data);
  };

  const loadQuarterlyShiftSummary = async () => {
    const res = await fetch(`${API_BASE}/summaries/quarterly_shift`);
    if (!res.ok) throw new Error("Failed to load quarterly shift summary");
    const data = await res.json();
    setQuarterlyShiftSummary(data);
  };

  const loadQuarterlyPrices = async () => {
    const res = await fetch(`${API_BASE}/quarterly_prices`);
    if (!res.ok) throw new Error("Failed to load quarterly prices");
    const data = await res.json();
    setQuarterlyPrices(data);
  };

  const loadTranscriptsList = async () => {
    const res = await fetch(`${API_BASE}/transcripts`);
    if (!res.ok) throw new Error("Failed to load transcripts list");
    const data = await res.json();
    const cleaned = data.filter((t: Transcript) => t.name.endsWith("_cleaned.txt"));
    cleaned.sort((a: Transcript, b: Transcript) => a.name.localeCompare(b.name));
    setTranscripts(cleaned);

    if (cleaned.length > 0 && !selectedTranscript) {
      handleSelectTranscript(cleaned[0].name);
    }
  };

  const handleSelectTranscript = useCallback((filename: string) => {
    setSelectedTranscript(filename);
    setSelectedTopTab("transcript");
    setManagementTranscriptContent("");
    setQaTranscriptContent("");
  }, []);

  const loadAllData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      await Promise.all([
        loadSentiment().catch((e) => console.warn(e)),
        loadStrategicFocuses().catch((e) => console.warn(e)),
        loadQuarterlyShift().catch((e) => console.warn(e)),
        loadQuarterlyShiftSummary().catch((e) => console.warn(e)),
        loadQuarterlyPrices().catch((e) => console.warn(e)),
        loadTranscriptsList().catch((e) => console.warn(e)),
      ]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Polling for pipeline status
  useEffect(() => {
    if (!isPollingStatus) return;

    let cancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/pipeline/status`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        if (data && typeof data.message === "string") {
          setPipelineStatus(data.message);
        } else {
          setPipelineStatus("Pipeline status: " + JSON.stringify(data));
        }

        if (data.state === "done" || data.state === "error") {
          clearInterval(intervalId);
          setIsPollingStatus(false);
        }
      } catch (err) {
        console.warn("Error polling pipeline status:", err);
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isPollingStatus]);

  // Load section transcripts
  useEffect(() => {
    const loadSections = async () => {
      if (!selectedTranscript) return;
      const base = selectedTranscript.endsWith("_cleaned.txt")
        ? selectedTranscript.replace("_cleaned.txt", "")
        : selectedTranscript;
      const mgmtFile = `${base}_prepared.txt`;
      const qaFile = `${base}_qa.txt`;

      try {
        await Promise.all([
          fetch(`${API_BASE}/transcript/${encodeURIComponent(mgmtFile)}`)
            .then((res) => res.json())
            .then((data) => setManagementTranscriptContent(data.content)),
          fetch(`${API_BASE}/transcript/${encodeURIComponent(qaFile)}`)
            .then((res) => res.json())
            .then((data) => setQaTranscriptContent(data.content)),
        ]);
      } catch (e: any) {
        setError(e.message || "Failed to load transcript sections");
      }
    };

    loadSections();
  }, [selectedTranscript]);

  // Derived data
  const getStrategicFocusesForSelected = () => {
    if (!strategicFocuses || !selectedTranscript) return null;
    const base = selectedTranscript.replace("_cleaned.txt", "");
    const key = base.toUpperCase();
    return strategicFocuses[key] || null;
  };

  const getSentimentForSelected = () => {
    if (!sentiment || !selectedTranscript) return null;
    const base = selectedTranscript.replace("_cleaned.txt", "");
    return sentiment.find((entry) => entry.file === base) || null;
  };

  const selectedSentiment = getSentimentForSelected();
  const managementSentiment = selectedSentiment?.management_scores || selectedSentiment?.management || null;
  const qaSentiment = selectedSentiment?.qa_scores || selectedSentiment?.qa || null;
  const selectedStrategicFocuses = getStrategicFocusesForSelected();

  const getQuarterFromFilename = (filename: string | null): string | null => {
    if (!filename) return null;

    const upper = filename.toUpperCase();

    const match = upper.match(/\bQ[1-4]\b/);
    if (match) {
      return match[0];
    }

    if (upper.includes("Q1")) return "Q1";
    if (upper.includes("Q2")) return "Q2";
    if (upper.includes("Q3")) return "Q3";
    if (upper.includes("Q4")) return "Q4";

    return null;
  };

  const selectedQuarter = getQuarterFromFilename(selectedTranscript);

  return {
    isRefreshing,
    isLoadingData,
    error,
    pipelineStatus,
    transcripts,
    selectedTranscript,
    selectedQuarter,
    selectedTopTab,
    managementTranscriptContent,
    qaTranscriptContent,
    quarterlyShift,
    quarterlyPrices,
    quarterlyShiftSummary,
    managementSentiment,
    qaSentiment,
    selectedStrategicFocuses,
    runPipeline,
    loadAllData,
    handleSelectTranscript,
    setSelectedTopTab,
  };
}
