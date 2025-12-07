import Plot from "react-plotly.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

interface SentimentPieChartsProps {
  managementSentiment: SentimentScores | null;
  qaSentiment: SentimentScores | null;
}

function PieChart({ data, title }: { data: SentimentScores; title: string }) {
  return (
    <div className="flex-1">
      <h3 className="mb-2 text-sm font-medium text-foreground">{title}</h3>
      <Plot
        data={[
          {
            type: "pie",
            labels: ["Positive", "Neutral", "Negative"],
            values: [
              data.positive ?? 0,
              data.neutral ?? 0,
              data.negative ?? 0,
            ],
            marker: {
              colors: ["#70aed5dd", "#71717aca", "#7206188f"],
            },
            textinfo: "label+percent",
            textfont: { color: "#000000ff", size: 11 },
            hole: 0.45,
            hovertemplate: "%{label}: %{percent}<extra></extra>",
          },
        ]}
        layout={{
          height: 200,
          margin: { t: 10, r: 10, b: 10, l: 10 },
          paper_bgcolor: "transparent",
          showlegend: false,
        }}
        style={{ width: "100%", height: "200px" }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
}

export function SentimentPieCharts({
  managementSentiment,
  qaSentiment,
}: SentimentPieChartsProps) {
  const hasData = managementSentiment || qaSentiment;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sentiment Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="text-center text-muted-foreground">
            Select a transcript to view sentiment breakdown.
          </p>
        ) : (
          <div className="flex gap-4">
            {managementSentiment && (
              <PieChart data={managementSentiment} title="Management" />
            )}
            {qaSentiment && <PieChart data={qaSentiment} title="Q&A" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
