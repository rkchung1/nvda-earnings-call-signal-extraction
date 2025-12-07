import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { QuarterSelector } from "@/components/dashboard/QuarterSelector";
import { StatusAlerts } from "@/components/dashboard/StatusAlerts";
import { QuarterlyShiftCharts } from "@/components/dashboard/QuarterlyShiftCharts";
import { QuarterlyPriceCharts } from "@/components/dashboard/QuarterlyPriceCharts";
import { SentimentHeatmap } from "@/components/dashboard/SentimentHeatmap";
import { SentimentPieCharts } from "@/components/dashboard/SentimentPieCharts";
import { TranscriptViewer } from "@/components/dashboard/TranscriptViewer";
import { StrategicFocuses } from "@/components/dashboard/StrategicFocuses";
import { CrossQuarterSummary } from "@/components/dashboard/CrossQuarterSummary";
import { useDashboardData } from "@/hooks/useDashboardData";

const Index = () => {
  const {
    isRefreshing,
    isLoadingData,
    error,
    pipelineStatus,
    transcripts,
    selectedTranscript,
    selectedTopTab,
    managementTranscriptContent,
    qaTranscriptContent,
    quarterlyShift,
    quarterlyShiftSummary,
    quarterlyPrices,
    selectedQuarter,
    managementSentiment,
    qaSentiment,
    selectedStrategicFocuses,
    runPipeline,
    loadAllData,
    handleSelectTranscript,
    setSelectedTopTab,
  } = useDashboardData();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader
        isRefreshing={isRefreshing}
        isLoadingData={isLoadingData}
        onRunPipeline={runPipeline}
        onReloadData={loadAllData}
      />

      <QuarterSelector
        transcripts={transcripts}
        selectedTranscript={selectedTranscript}
        selectedTab={selectedTopTab}
        onSelectTranscript={handleSelectTranscript}
        onSelectAnalysis={() => setSelectedTopTab("analysis")}
      />

      <StatusAlerts error={error} pipelineStatus={pipelineStatus} />

      <main className="flex-1 p-6">
        {selectedTopTab === "analysis" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <QuarterlyShiftCharts
                data={quarterlyShift}
                prices={quarterlyPrices}
              />
            </div>
            <div className="space-y-6">
              <SentimentHeatmap data={quarterlyShift} />
              <CrossQuarterSummary summary={quarterlyShiftSummary} />
            </div>
          </div>
        ) : (
          <div className="grid h-[calc(100vh-220px)] grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <QuarterlyPriceCharts
                data={quarterlyPrices}
                selectedQuarter={selectedQuarter}
              />
              <TranscriptViewer
                managementContent={managementTranscriptContent}
                qaContent={qaTranscriptContent}
                hasTranscript={!!selectedTranscript}
              />
            </div>
            <div className="space-y-6">
              <SentimentPieCharts
                managementSentiment={managementSentiment}
                qaSentiment={qaSentiment}
              />
              <StrategicFocuses focuses={selectedStrategicFocuses} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
