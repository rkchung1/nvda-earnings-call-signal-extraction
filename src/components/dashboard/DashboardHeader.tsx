import { RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  isRefreshing: boolean;
  isLoadingData: boolean;
  onRunPipeline: () => void;
  onReloadData: () => void;
}

export function DashboardHeader({
  isRefreshing,
  isLoadingData,
  onRunPipeline,
  onReloadData,
}: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-xl font-bold text-primary-foreground">N</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              NVIDIA Earnings Dashboard
            </h1>
            <p className="text-xs text-muted-foreground">
              Quarterly Transcript Analysis
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onReloadData}
          disabled={isLoadingData}
          className="gap-2"
        >
          <Database className="h-4 w-4" />
          {isLoadingData ? "Loading..." : "Reload Data"}
        </Button>
        <Button
          size="sm"
          onClick={onRunPipeline}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Running..." : "Run Pipeline"}
        </Button>
      </div>
    </header>
  );
}
