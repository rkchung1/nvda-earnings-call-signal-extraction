import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb } from "lucide-react";

interface StrategicFocus {
  theme: string;
  summary: string;
}

interface StrategicFocusesProps {
  focuses: StrategicFocus[] | null;
}

export function StrategicFocuses({ focuses }: StrategicFocusesProps) {
  return (
    <Card className="h-[650px] overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" />
          Strategic Focuses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!focuses || focuses.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No strategic focuses available for this transcript.
          </p>
        ) : (
          <ScrollArea className="h-[550px] pr-2">
            <ul className="space-y-4">
              {focuses.map((item, idx) => (
                <li
                  key={idx}
                  className="rounded-lg border border-border bg-muted/30 p-3"
                >
                  <strong className="text-sm font-semibold text-primary">
                    {item.theme}
                  </strong>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.summary}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
