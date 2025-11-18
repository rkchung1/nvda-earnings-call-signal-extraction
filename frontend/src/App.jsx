import { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import NvidiaLogo from "./assets/Nvidia_logo.svg.png";

function QuarterlyShiftCharts({ data }) {
  if (!data || !data.management || !data.qa) {
    return <p style={{ color: "#777" }}>No quarterly shift data available.</p>;
  }

  const mgmt = data.management;
  const qa = data.qa;

  const makeTraces = (section) => {
    const quarters = section.quarters;
    const pos = section.positive;
    const neu = section.neutral;
    const neg = section.negative;
    const net = section.net_sentiment;

    const negVals = neg.map((n) => -n);
    const neuTop = neu.map((n) => n / 2);
    const neuBottom = neu.map((n) => -n / 2);
    const netText = net.map((v) => {
      const pct = (v * 100).toFixed(0);
      const sign = v > 0 ? "+" : v < 0 ? "" : "";
      return `${sign}${pct}%`;
    });

    return [
      {
        type: "bar",
        name: "Negative",
        x: quarters,
        y: negVals,
        marker: { color: "#d05a5aff" },
        hovertemplate: "%{x}<br>Negative: %{y:.1%}<extra></extra>",
      },
      {
        type: "bar",
        name: "Neutral",
        x: quarters,
        y: neuTop,
        base: neuBottom,
        marker: { color: "#c5c5c5" },
        hovertemplate: "%{x}<br>Neutral: %{y:.1%}<extra></extra>",
      },
      {
        type: "bar",
        name: "Positive",
        x: quarters,
        y: pos,
        marker: { color: "#3e84f3ff" },
        hovertemplate: "%{x}<br>Positive: %{y:.1%}<extra></extra>",
      },
      {
        type: "scatter",
        mode: "lines+markers+text",
        name: "Net Sentiment",
        x: quarters,
        y: net,
        line: { color: "black", width: 1 },
        marker: { size: 6, color: "black" },
        text: netText,
        textposition: "top center",
        hovertemplate: "%{x}<br>Net Sentiment: %{y:.1%}<extra></extra>",
      },
    ];
  };

  const layoutBase = {
    barmode: "relative",
    height: 280,
    margin: { t: 30, r: 40, b: 40, l: 50 },
    plot_bgcolor: "white",
    xaxis: { title: "Quarter", showgrid: false },
    yaxis: {
      title: "Sentiment Proportion",
      tickformat: ".0%",
      zeroline: true,
      zerolinewidth: 1.5,
      zerolinecolor: "gray",
      range: [-1, 1],
    },
    hovermode: "x unified",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        width: "100%",
        height: "100%",
      }}
    >
      {/* Shared legend above both charts */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.75rem",
          fontSize: "0.8rem",
          marginBottom: "0.25rem",
        }}
      >
        <span style={{ fontWeight: 600, marginRight: "0.5rem" }}>Sentiment Type</span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: "#d05a5aff",
            }}
          />
          Negative
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: "#ddddddff",
            }}
          />
          Neutral
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: "#3e84f3ff",
            }}
          />
          Positive
        </span>

        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          <span
            style={{
              width: 18,
              height: 0,
              borderTop: "2px solid black",
            }}
          />
          Net Sentiment
        </span>
      </div>

      <div style={{ width: "100%" }}>
        <h3 style={{ marginTop: 0 }}>Management</h3>
        <Plot
          data={makeTraces(mgmt)}
          layout={{
            ...layoutBase,
            title: undefined,
            showlegend: false,
          }}
          useResizeHandler
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ width: "100%" }}>
        <h3 style={{ marginTop: 0 }}>Q&amp;A</h3>
        <Plot
          data={makeTraces(qa)}
          layout={{
            ...layoutBase,
            title: undefined,
            showlegend: false,
          }}
          useResizeHandler
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
}

function SentimentHeatmapTable({ section, title }) {
  if (!section) return null;

  const { quarters, positive, neutral, negative } = section;

  const makeCellStyle = (value, type) => {
    const v = Math.max(0, Math.min(1, value ?? 0)); // clamp 0–1
    if (type === "positive") {
      // Blue with increasing opacity for higher positive
      const alpha = 0.15 + 0.65 * v;
      return {
        backgroundColor: `rgba(133, 161, 203, ${alpha})`,
      };
    }
    if (type === "negative") {
      // Red with increasing opacity for higher negative
      const alpha = 0.15 + 0.65 * v;
      return {
        backgroundColor: `rgba(200, 122, 122, ${alpha})`,
      };
    }
    // Neutral: grayscale from very light to darker gray as neutral increases
    const level = 255 - Math.round(v * 120); // 255 -> 135
    return {
      backgroundColor: `rgb(${level}, ${level}, ${level})`,
    };
  };

  const formatPct = (value) => `${Math.round((value ?? 0) * 100)}%`;

  return (
    <div style={{ width: "100%" }}>
      <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>{title}</h3>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: "100%",
            fontSize: "0.75rem",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  padding: "0.25rem 0.5rem",
                  border: "1px solid #ddd",
                  background: "#f5f5f5",
                  textAlign: "left",
                  position: "sticky",
                  left: 0,
                  zIndex: 1,
                }}
              >
                Sentiment
              </th>
              {quarters.map((q) => (
                <th
                  key={q}
                  style={{
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #ddd",
                    background: "#f5f5f5",
                    textAlign: "center",
                  }}
                >
                  {q}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                style={{
                  padding: "0.25rem 0.5rem",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                  fontWeight: 600,
                }}
              >
                Positive
              </td>
              {quarters.map((q, idx) => (
                <td
                  key={`pos-${q}`}
                  style={{
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #ddd",
                    textAlign: "center",
                    ...makeCellStyle(positive[idx], "positive"),
                  }}
                >
                  {formatPct(positive[idx])}
                </td>
              ))}
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.25rem 0.5rem",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                  fontWeight: 600,
                }}
              >
                Neutral
              </td>
              {quarters.map((q, idx) => (
                <td
                  key={`neu-${q}`}
                  style={{
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #ddd",
                    textAlign: "center",
                    ...makeCellStyle(neutral[idx], "neutral"),
                  }}
                >
                  {formatPct(neutral[idx])}
                </td>
              ))}
            </tr>
            <tr>
              <td
                style={{
                  padding: "0.25rem 0.5rem",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                  fontWeight: 600,
                }}
              >
                Negative
              </td>
              {quarters.map((q, idx) => (
                <td
                  key={`neg-${q}`}
                  style={{
                    padding: "0.25rem 0.5rem",
                    border: "1px solid #ddd",
                    textAlign: "center",
                    ...makeCellStyle(negative[idx], "negative"),
                  }}
                >
                  {formatPct(negative[idx])}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const API_BASE = "http://localhost:8000";

function App() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);

  const [sentiment, setSentiment] = useState(null);
  const [strategicFocuses, setStrategicFocuses] = useState(null);
  const [quarterlyShift, setQuarterlyShift] = useState(null);
  const [quarterlyShiftSummary, setQuarterlyShiftSummary] = useState(null);

  const [transcripts, setTranscripts] = useState([]);
  const [selectedTranscript, setSelectedTranscript] = useState(null);
  const [managementTranscriptContent, setManagementTranscriptContent] = useState("");
  const [qaTranscriptContent, setQaTranscriptContent] = useState("");
  const [selectedTopTab, setSelectedTopTab] = useState("transcript");

  // ---------- API calls ----------

  const runPipeline = async () => {
    setIsRefreshing(true);
    setError(null);
    setPipelineStatus("Starting pipeline...");
    setIsPollingStatus(false);

    try {
      const res = await fetch(`${API_BASE}/pipeline/refresh`, {
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Pipeline error: ${res.status}`);
      }
      // Start polling backend status messages
      setIsPollingStatus(true);
    } catch (e) {
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
    if (!res.ok) {
      throw new Error("Failed to load sentiment");
    }
    const data = await res.json();
    setSentiment(data);
  };

  const loadStrategicFocuses = async () => {
    const res = await fetch(`${API_BASE}/strategic_focuses`);
    if (!res.ok) {
      throw new Error("Failed to load strategic focuses");
    }
    const data = await res.json();
    setStrategicFocuses(data);
  };

  const loadQuarterlyShift = async () => {
    const res = await fetch(`${API_BASE}/quarterly_shift`);
    if (!res.ok) {
      throw new Error("Failed to load quarterly shift");
    }
    const data = await res.json();
    setQuarterlyShift(data);
  };

  const loadQuarterlyShiftSummary = async () => {
    const res = await fetch(`${API_BASE}/summaries/quarterly_shift`);
    if (!res.ok) {
      throw new Error("Failed to load quarterly shift summary");
    }
    const data = await res.json(); // { filename, content }
    setQuarterlyShiftSummary(data);
  };

  const loadTranscriptsList = async () => {
    const res = await fetch(`${API_BASE}/transcripts`);
    if (!res.ok) {
      throw new Error("Failed to load transcripts list");
    }
    const data = await res.json();
    const cleaned = data.filter((t) => t.name.endsWith("_cleaned.txt"));
    cleaned.sort((a, b) => a.name.localeCompare(b.name));
    setTranscripts(cleaned);

    if (cleaned.length > 0 && !selectedTranscript) {
      // Auto-select the first transcript
      handleSelectTranscript(cleaned[0].name);
    }
  };

  const handleSelectTranscript = (filename) => {
    setSelectedTranscript(filename);
    setSelectedTopTab("transcript");
    // reset per-section transcript state when switching transcripts
    setManagementTranscriptContent("");
    setQaTranscriptContent("");
  };

  const loadAllData = async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      await Promise.all([
        loadSentiment().catch((e) => console.warn(e)),
        loadStrategicFocuses().catch((e) => console.warn(e)),
        loadQuarterlyShift().catch((e) => console.warn(e)),
        loadQuarterlyShiftSummary().catch((e) => console.warn(e)),
        loadTranscriptsList().catch((e) => console.warn(e)),
      ]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!isPollingStatus) return;

    let cancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/pipeline/status`);
        if (!res.ok) {
          return;
        }
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
        // Log to console but don't break the UI
        console.warn("Error polling pipeline status:", err);
      }
    }, 2000); // poll every 2 seconds

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [isPollingStatus]);

  const loadSectionTranscript = async (filename, setContent) => {
    const res = await fetch(`${API_BASE}/transcript/${encodeURIComponent(filename)}`);
    if (!res.ok) {
      throw new Error("Failed to load transcript content");
    }
    const data = await res.json();
    setContent(data.content);
  };

  useEffect(() => {
    const loadSections = async () => {
      if (!selectedTranscript) return;
      const base =
        selectedTranscript && selectedTranscript.endsWith("_cleaned.txt")
          ? selectedTranscript.replace("_cleaned.txt", "")
          : selectedTranscript;
      const mgmtFile = `${base}_prepared.txt`;
      const qaFile = `${base}_qa.txt`;

      try {
        await Promise.all([
          loadSectionTranscript(mgmtFile, setManagementTranscriptContent),
          loadSectionTranscript(qaFile, setQaTranscriptContent),
        ]);
      } catch (e) {
        setError(e.message || "Failed to load transcript sections");
      }
    };

    loadSections();
  }, [selectedTranscript]);

  const formatTranscriptLabel = (filename) => {
    if (!filename) return "";
    // Expecting names like: "nvidia-nvda-q1-2025-earnings-call-transcript_cleaned.txt"
    const match = filename.match(/q(\d)-(\d{4})/i);
    if (match) {
      const quarter = match[1];
      const year = match[2];
      return `Q${quarter} ${year}`;
    }
    // Fallback: use the raw name if it doesn't match the pattern
    return filename;
  };

  // ---------- UI ----------

  const getStrategicFocusesForSelected = () => {
    if (!strategicFocuses || !selectedTranscript) return null;

    // Example:
    // "nvidia-nvda-q1-2025-earnings-call-transcript_cleaned.txt"
    const base = selectedTranscript.replace("_cleaned.txt", ""); // "nvidia-nvda-q1-2025-earnings-call-transcript"
    const key = base.toUpperCase(); // "NVIDIA-NVDA-Q1-2025-EARNINGS-CALL-TRANSCRIPT"

    return strategicFocuses[key] || null;
  };

  const selectedStrategicFocuses = getStrategicFocusesForSelected();

  const getSentimentForSelected = () => {
    if (!sentiment || !selectedTranscript) return null;

    // Example:
    // selectedTranscript = "nvidia-nvda-q1-2025-earnings-call-transcript_cleaned.txt"
    // sentiment[i].file = "nvidia-nvda-q1-2025-earnings-call-transcript"
    const base = selectedTranscript.replace("_cleaned.txt", "");

    return Array.isArray(sentiment)
      ? sentiment.find((entry) => entry.file === base) || null
      : null;
  };

  const selectedSentiment = getSentimentForSelected();
  const managementSentiment =
    selectedSentiment &&
    (selectedSentiment.management_scores || selectedSentiment.management);
  const qaSentiment =
    selectedSentiment && (selectedSentiment.qa_scores || selectedSentiment.qa);

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        padding: "1.5rem",
        width: "100%",
        minWidth: "100vw",
        maxWidth: "100vw",
        boxSizing: "border-box",
        margin: "0 auto",
        minHeight: "100vh", // fill the full viewport height
        display: "flex", // layout header + main vertically
        flexDirection: "column",
      }}
    >
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <img
            src={NvidiaLogo}
            alt="NVIDIA logo"
            style={{ height: "62px", width: "auto", display: "block" }}
          />
          <h1 style={{ margin: 0 }}>NVIDIA Earnings Call Dashboard</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            onClick={runPipeline}
            disabled={isRefreshing}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            {isRefreshing ? "Running pipeline..." : "Run Pipeline"}
          </button>
          <button
            onClick={loadAllData}
            disabled={isLoadingData}
            style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
          >
            {isLoadingData ? "Loading data..." : "Reload Data"}
          </button>
        </div>
      </header>

      {/* Top transcript + analysis buttons */}
      <div
        style={{
          marginBottom: "0.75rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          width: "100%",
        }}
      >
        {transcripts.map((t) => (
          <button
            key={t.name}
            onClick={() => handleSelectTranscript(t.name)}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: 4,
              border:
                selectedTopTab !== "analysis" && t.name === selectedTranscript
                  ? "1px solid #446"
                  : "1px solid #ccc",
              background:
                selectedTopTab !== "analysis" && t.name === selectedTranscript
                  ? "#eef"
                  : "#f7f7f7",
              cursor: "pointer",
              fontSize: "0.85rem",
              whiteSpace: "nowrap",
            }}
          >
            {formatTranscriptLabel(t.name)}
          </button>
        ))}
        <button
          onClick={() => setSelectedTopTab("analysis")}
          style={{
            padding: "0.4rem 0.75rem",
            borderRadius: 4,
            border: selectedTopTab === "analysis" ? "1px solid #446" : "1px solid #ccc",
            background: selectedTopTab === "analysis" ? "#eef" : "#f7f7f7",
            cursor: "pointer",
            fontSize: "0.85rem",
            whiteSpace: "nowrap",
            marginLeft: "auto",
          }}
        >
          Cross-Quarter Analysis
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", background: "#ffe5e5", color: "#900" }}>
          {error}
        </div>
      )}
      {pipelineStatus && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            background: "#e5ffe5",
            color: "#064",
          }}
        >
          {pipelineStatus}
        </div>
      )}

      {selectedTopTab === "analysis" ? (
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
            gap: "1.0rem",
            flex: 1,
            minWidth: 0,
            alignItems: "stretch",
          }}
        >
          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "1rem",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              height: "100%",
            }}
          >
            <h2>Quarterly Sentiment Shift</h2>
            {!quarterlyShift ? (
              <p style={{ color: "#777" }}>No quarterly shift data loaded.</p>
            ) : (
              <div style={{ marginTop: "0.5rem" }}>
                <QuarterlyShiftCharts data={quarterlyShift} />
              </div>
            )}
          </section>
          <section
            style={{
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "1rem",
              }}
            >
              <h2>Sentiment Heatmaps</h2>
              {!quarterlyShift ? (
                <p style={{ color: "#777" }}>No quarterly shift data loaded.</p>
              ) : (
                <>
                  <SentimentHeatmapTable
                    section={quarterlyShift.management}
                    title="Management"
                  />
                  <SentimentHeatmapTable section={quarterlyShift.qa} title="Q&amp;A" />
                </>
              )}
            </div>

            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: "1rem",
              }}
            >
              <h2>Cross-Quarter Summary</h2>
              {!quarterlyShiftSummary ? (
                <p style={{ color: "#777" }}>No summary loaded.</p>
              ) : (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  {quarterlyShiftSummary.content}
                </pre>
              )}
            </div>
          </section>
        </main>
      ) : (
        <main
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "3.0rem",
            flex: 1,
            minWidth: 0,
            alignItems: "stretch",
          }}
        >
          {/* Transcript content (left side) */}
          <section
            style={{
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: "1rem",
              width: "100%",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              height: "100%",
            }}
          >
            <h2>Full Transcript</h2>
            {transcripts.length === 0 ? (
              <p style={{ color: "#777" }}>
                No transcripts found. Run the pipeline or check the backend data folder.
              </p>
            ) : !selectedTranscript ? (
              <p style={{ color: "#777" }}>Select a transcript from the top row.</p>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  flex: 1,
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minHeight: 0,
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>Management Section</h3>
                    <div
                      style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        borderTop: "1px solid #eee",
                        paddingTop: "0.5rem",
                      }}
                    >
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.85rem",
                          margin: 0,
                        }}
                      >
                        {managementTranscriptContent || "Loading..."}
                      </pre>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      flex: 1,
                      minHeight: 0,
                    }}
                  >
                    <h3 style={{ margin: 0, marginBottom: "0.5rem" }}>Q&amp;A Section</h3>
                    <div
                      style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        borderTop: "1px solid #eee",
                        paddingTop: "0.5rem",
                      }}
                    >
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.85rem",
                          margin: 0,
                        }}
                      >
                        {qaTranscriptContent || "Loading..."}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Insights (right side) */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              minWidth: 0,
            }}
          >
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
              <h2>Sentiment Breakdown</h2>
              {!sentiment ? (
                <p style={{ color: "#777" }}>No sentiment data loaded.</p>
              ) : !selectedTranscript ? (
                <p style={{ color: "#777" }}>
                  Select a transcript to view its sentiment breakdown.
                </p>
              ) : !selectedSentiment ? (
                <p style={{ color: "#777" }}>
                  No sentiment data found for the selected transcript.
                </p>
              ) : !managementSentiment && !qaSentiment ? (
                <p style={{ color: "#777" }}>
                  No management or Q&amp;A sentiment data available for this transcript.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "1rem",
                  }}
                >
                  {managementSentiment && (
                    <div>
                      <h3 style={{ marginTop: 0 }}>Management</h3>
                      <Plot
                        data={[
                          {
                            type: "pie",
                            labels: ["Positive", "Neutral", "Negative"],
                            values: [
                              managementSentiment.positive ?? 0,
                              managementSentiment.neutral ?? 0,
                              managementSentiment.negative ?? 0,
                            ],
                            marker: {
                              colors: ["#3e84f3ff", "#ddddddff", "#d05a5aff"], // Positive, Neutral, Negative
                            },
                            textinfo: "label+percent",
                            hole: 0.4,
                          },
                        ]}
                        layout={{
                          height: 260,
                          margin: { t: 30, r: 10, b: 30, l: 10 },
                          showlegend: false,
                        }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  )}
                  {qaSentiment && (
                    <div>
                      <h3 style={{ marginTop: 0 }}>Q&amp;A</h3>
                      <Plot
                        data={[
                          {
                            type: "pie",
                            labels: ["Positive", "Neutral", "Negative"],
                            values: [
                              qaSentiment.positive ?? 0,
                              qaSentiment.neutral ?? 0,
                              qaSentiment.negative ?? 0,
                            ],
                            marker: {
                              colors: ["#3e84f3ff", "#ddddddff", "#d05a5aff"], // Positive, Neutral, Negative
                            },
                            textinfo: "label+percent",
                            hole: 0.4,
                          },
                        ]}
                        layout={{
                          height: 260,
                          margin: { t: 30, r: 10, b: 30, l: 10 },
                          showlegend: false,
                        }}
                        style={{ width: "100%", height: "100%" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: "1rem" }}>
              <h2>Strategic Focuses</h2>
              {!strategicFocuses ? (
                <p style={{ color: "#777" }}>No strategic focuses loaded.</p>
              ) : !selectedTranscript ? (
                <p style={{ color: "#777" }}>Select a transcript to view its strategic focuses.</p>
              ) : !selectedStrategicFocuses || selectedStrategicFocuses.length === 0 ? (
                <p style={{ color: "#777" }}>
                  No strategic focuses found for the selected transcript.
                </p>
              ) : (
                <ul>
                  {selectedStrategicFocuses.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: "0.5rem" }}>
                      <strong>{item.theme}</strong>
                      <br />
                      <span>{item.summary}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default App;