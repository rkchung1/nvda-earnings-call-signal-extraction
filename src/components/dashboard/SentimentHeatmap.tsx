import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionData {
  quarters: string[];
  positive: number[];
  neutral: number[];
  negative: number[];
}

interface SentimentHeatmapProps {
  data: { management: SectionData; qa: SectionData } | null;
}

const hexToRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

function HeatmapTable({ section, title }: { section: SectionData; title: string }) {
  const { quarters, positive, neutral, negative } = section;

  const getCellStyle = (value: number, type: "positive" | "neutral" | "negative") => {
    const v = Math.max(0, Math.min(1, value ?? 0));
    const opacity = 0.2 + 0.6 * v;

    if (type === "positive") {
    return { backgroundColor: hexToRgba("#70aed5", opacity) };
    }
    if (type === "negative") {
      return { backgroundColor: hexToRgba("#720618", opacity) };
    }
    return { backgroundColor: hexToRgba("#71717a", opacity) };

  };

  const formatPct = (value: number) => `${Math.round((value ?? 0) * 100)}%`;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 border border-border bg-muted px-2 py-1.5 text-left font-medium">
                Sentiment
              </th>
              {quarters.map((q) => (
                <th
                  key={q}
                  className="border border-border bg-muted px-2 py-1.5 text-center font-medium"
                >
                  {q}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="sticky left-0 z-10 border border-border bg-card px-2 py-1.5 font-medium">
                Positive
              </td>
              {quarters.map((q, idx) => (
                <td
                  key={`pos-${q}`}
                  className="border border-border px-2 py-1.5 text-center font-mono"
                  style={getCellStyle(positive[idx], "positive")}
                >
                  {formatPct(positive[idx])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 z-10 border border-border bg-card px-2 py-1.5 font-medium">
                Neutral
              </td>
              {quarters.map((q, idx) => (
                <td
                  key={`neu-${q}`}
                  className="border border-border px-2 py-1.5 text-center font-mono"
                  style={getCellStyle(neutral[idx], "neutral")}
                >
                  {formatPct(neutral[idx])}
                </td>
              ))}
            </tr>
            <tr>
              <td className="sticky left-0 z-10 border border-border bg-card px-2 py-1.5 font-medium">
                Negative
              </td>
              {quarters.map((q, idx) => (
                <td
                  key={`neg-${q}`}
                  className="border border-border px-2 py-1.5 text-center font-mono"
                  style={getCellStyle(negative[idx], "negative")}
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

export function SentimentHeatmap({ data }: SentimentHeatmapProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No heatmap data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment Heatmaps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <HeatmapTable section={data.management} title="Management" />
        <HeatmapTable section={data.qa} title="Q&A" />
      </CardContent>
    </Card>
  );
}
