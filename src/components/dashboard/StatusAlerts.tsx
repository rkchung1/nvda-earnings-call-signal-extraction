import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StatusAlertsProps {
  error: string | null;
  pipelineStatus: string | null;
}

export function StatusAlerts({ error, pipelineStatus }: StatusAlertsProps) {
  if (!error && !pipelineStatus) return null;

  return (
    <div className="space-y-2 px-6 py-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {pipelineStatus && (
        <Alert className="border-primary/50 bg-primary/10">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription className="text-foreground">
            {pipelineStatus}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
