// src/components/dashboard/QuarterlyPriceCharts.tsx
import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface QuarterlyPriceChartsProps {
  data: QuarterlyPriceData | null;
  selectedQuarter?: string | null; // e.g. "Q1"
}

// Build traces from a list of quarters (usually 1 when filtering)
function makePriceTraces(quarters: QuarterlyPriceQuarter[]) {
  return quarters.map((quarter) => {
    const x = quarter.points.map((p) => p.date);
    const y = quarter.points.map((p) => p.adjusted_close);

    return {
      type: "scatter" as const,
      mode: "lines+markers" as const,
      name: quarter.name,
      x,
      y,
      hovertemplate:
        "%{x}<br>" +
        `${quarter.name} adj close: $%{y:.2f}<extra></extra>`,
    };
  });
}

const layoutBase = {
  height: 320,
  margin: { t: 40, r: 40, b: 50, l: 60 },
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  xaxis: {
    title: { text: "Week ending", font: { color: "#84848bff", size: 12 } },
    showgrid: false,
    tickfont: { color: "#84848bff" },
    type: "date" as const,
  },
  yaxis: {
    title: { text: "Adjusted Close Price ($)", font: { color: "#84848bff", size: 12 } },
    gridcolor: "#27272abc",
    tickfont: { color: "#84848bff" },
  },
  hovermode: "x unified" as const,
  legend: {
    orientation: "h" as const,
    x: 0,
    y: 1.1,
    font: { color: "#e4e4e7", size: 11 },
  },
};

export function QuarterlyPriceCharts({
  data,
  selectedQuarter,
}: QuarterlyPriceChartsProps) {
  if (!data || !data.quarters || data.quarters.length === 0) {
    return (
      <Card className="h-[1000px] overflow-hidden">
        <CardContent className="flex h-full items-center justify-center py-8">
          <p className="text-center text-muted-foreground">
            No quarterly price data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Decide which quarter(s) to show
  let quartersToShow = data.quarters;

  if (selectedQuarter) {
    // 1) try exact match (e.g. "Q1")
    let chosen =
      data.quarters.find((q) => q.name === selectedQuarter) ?? null;

    // 2) fallback: loose match, in case your tab label is like "Q1 2025"
    if (!chosen) {
      chosen =
        data.quarters.find(
          (q) =>
            selectedQuarter.includes(q.name) ||
            q.name.includes(selectedQuarter),
        ) ?? null;
    }

    if (chosen) {
      quartersToShow = [chosen];
    }
  }

  const traces = makePriceTraces(quartersToShow);

  return (
    <Card className="flex h-[fit-content] flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold tracking-tight text-foreground">
          Weekly Adjusted Close Prices
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Plot
            data={traces}
            layout={layoutBase}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
            config={{ displayModeBar: false }}
          />
        </div>
      </CardContent>
    </Card>
  );
}