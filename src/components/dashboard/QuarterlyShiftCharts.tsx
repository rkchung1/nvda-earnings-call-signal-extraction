import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SectionData {
  quarters: string[];
  positive: number[];
  neutral: number[];
  negative: number[];
  net_sentiment: number[];
}

interface QuarterlyShiftData {
  management: SectionData;
  qa: SectionData;
}

interface QuarterlyShiftChartsProps {
  data: QuarterlyShiftData | null;
  prices?: QuarterlyPriceData | null;
}

interface QuarterlyPricePoint {
  date: string;           // e.g. "2024-02-02"
  adjusted_close: number; // e.g. 66.1237
}

interface QuarterlyPriceQuarter {
  name: string;               // e.g. "Q1"
  start: string;              // e.g. "2024-01-27"
  end: string;                // e.g. "2024-04-28"
  points: QuarterlyPricePoint[];
}

interface QuarterlyPriceData {
  symbol: string;                 // e.g. "NVDA"
  fiscal_year: number;            // e.g. 2025
  quarters: QuarterlyPriceQuarter[];
}

function getQuarterPriceChanges(
  prices: QuarterlyPriceData | null,
  sectionQuarters: string[]
): number[] | null {
  if (!prices) return null;

  return sectionQuarters.map((label) => {
    const labelUpper = label.toUpperCase();
    const match =
      prices.quarters.find((q) => {
        const qName = q.name.toUpperCase();
        return labelUpper.includes(qName) || qName.includes(labelUpper);
      }) || null;

    if (!match || match.points.length === 0) return 0;

    const first = match.points[0].adjusted_close;
    const last = match.points[match.points.length - 1].adjusted_close;
    return (last - first) / first;
  });
}

function SentimentLegend() {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4 text-sm">
      <span className="font-medium text-muted-foreground">Sentiment Type:</span>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-chart-negative" />
        <span className="text-foreground">Negative</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-chart-neutral" />
        <span className="text-foreground">Neutral</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-3 w-3 rounded-sm bg-chart-positive" />
        <span className="text-foreground">Positive</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-0.5 w-4 bg-foreground" />
        <span className="text-foreground">Net Sentiment</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-0.5 w-4 bg-[#006cbec5]" />
        <span className="text-foreground">Price Change (%change)</span>
      </div>
    </div>
  );
}

function makeTraces(section: SectionData, priceChange?: number[] | null) {
  const { quarters, positive, neutral, negative, net_sentiment } = section;

  const negVals = negative.map((n) => -n);
  const neuTop = neutral.map((n) => n / 2);
  const neuBottom = neutral.map((n) => -n / 2);
  const netText = net_sentiment.map((v) => {
    const pct = (v * 100).toFixed(0);
    const sign = v > 0 ? "+" : "";
    return `${sign}${pct}%`;
  });

  const priceText =
    priceChange && priceChange.length === quarters.length
      ? priceChange.map((v) => {
          const pct = (v * 100).toFixed(0);
          const sign = v > 0 ? "+" : "";
          return `${sign}${pct}%`;
        })
      : undefined;

  const traces: any[] = [
    {
      type: "bar" as const,
      name: "Negative",
      x: quarters,
      y: negVals,
      marker: { color: "#7206188f" },
      hovertemplate: "%{x}<br>Negative: %{y:.1%}<extra></extra>",
    },
    {
      type: "bar" as const,
      name: "Neutral",
      x: quarters,
      y: neuTop,
      base: neuBottom,
      marker: { color: "#71717aca" },
      hovertemplate: "%{x}<br>Neutral: %{y:.1%}<extra></extra>",
    },
    {
      type: "bar" as const,
      name: "Positive",
      x: quarters,
      y: positive,
      marker: { color: "#70aed5dd" },
      hovertemplate: "%{x}<br>Positive: %{y:.1%}<extra></extra>",
    },
    {
      type: "scatter" as const,
      mode: "lines+markers+text" as const,
      name: "Net Sentiment",
      x: quarters,
      y: net_sentiment,
      line: { color: "#000000af", width: 2 },
      marker: { size: 6, color: "#000000af" },
      text: netText,
      textposition: "top center" as const,
      textfont: { color: "#f5f5f5", size: 10 },
      hovertemplate: "%{x}<br>Net Sentiment: %{y:.1%}<extra></extra>",
    },
  ];
  if (priceChange && priceChange.length === quarters.length) {
    traces.push({
      type: "scatter" as const,
      mode: "lines+markers+text" as const,
      name: "Price change",
      x: quarters,
      y: priceChange,
      line: { width: 2, color: "#006cbec5" },
      marker: { size: 6, color: "#006cbec5" },
      text: priceText,
      textposition: "top center" as const,
      textfont: { color: "#006cbec5", size: 10 },
      hovertemplate:
        "%{x}<br>Price change: %{y:.1%}<extra></extra>",
    });
  }
  return traces;
}

const layoutBase = {
  barmode: "relative" as const,
  height: 280,
  margin: { t: 20, r: 60, b: 40, l: 50 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: {
    title: { text: "Quarter", font: { color: "#a1a1aa", size: 12 } },
    showgrid: false,
    tickfont: { color: "#a1a1aa" },
  },
  yaxis: {
    title: { text: "Sentiment Proportion", font: { color: "#a1a1aa", size: 12 } },
    tickformat: ".0%",
    zeroline: true,
    zerolinewidth: 1,
    zerolinecolor: "#3f3f46",
    range: [-1, 1],
    gridcolor: "#27272a",
    tickfont: { color: "#a1a1aa" },
  },
  hovermode: "x unified" as const,
  showlegend: false,
};

export function QuarterlyShiftCharts({ data, prices }: QuarterlyShiftChartsProps) {
  if (!data || !data.management || !data.qa) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No quarterly shift data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const priceChange = getQuarterPriceChanges(
    prices ?? null,
    data.management.quarters
  );

  const maxPriceChange =
    priceChange && priceChange.length > 0
      ? Math.max(...priceChange.map((v) => Math.abs(v)))
      : 0.3;

  const layoutWithPriceRange = layoutBase;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quarterly Sentiment Shift</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SentimentLegend />

        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">Management</h3>
          <Plot
            data={makeTraces(data.management, priceChange)}
            layout={layoutWithPriceRange}
            useResizeHandler
            style={{ width: "100%", height: "280px" }}
            config={{ displayModeBar: false }}
          />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">Q&A</h3>
          <Plot
            data={makeTraces(data.qa, priceChange)}
            layout={layoutWithPriceRange}
            useResizeHandler
            style={{ width: "100%", height: "280px" }}
            config={{ displayModeBar: false }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
