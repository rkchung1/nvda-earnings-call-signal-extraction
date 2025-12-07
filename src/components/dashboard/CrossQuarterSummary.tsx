import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface CrossQuarterSummaryProps {
  summary: { content: string } | null;
}

export function CrossQuarterSummary({ summary }: CrossQuarterSummaryProps) {
  return (
    <Card className="h-[400px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-primary" />
          Cross-Quarter Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!summary ? (
          <p className="text-center text-muted-foreground">
            No summary available.
          </p>
        ) : (
          <ScrollArea className="h-[300px]">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {summary.content}
            </pre>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
