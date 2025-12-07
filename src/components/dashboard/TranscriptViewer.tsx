import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptViewerProps {
  managementContent: string;
  qaContent: string;
  hasTranscript: boolean;
}

export function TranscriptViewer({
  managementContent,
  qaContent,
  hasTranscript,
}: TranscriptViewerProps) {
  if (!hasTranscript) {
    return (
      <Card className="h-[1000px] overflow-hidden">
        <CardContent className="flex h-full items-center justify-center py-8">
          <p className="text-center text-muted-foreground">
            Select a transcript from the quarters above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-[1000px] flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Full Transcript</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Management Section
          </h3>
          <ScrollArea className="flex-1 rounded-md border border-border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
              {managementContent || "Loading..."}
            </pre>
          </ScrollArea>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Q&A Section
          </h3>
          <ScrollArea className="flex-1 rounded-md border border-border bg-muted/30 p-4">
            <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/90">
              {qaContent || "Loading..."}
            </pre>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
