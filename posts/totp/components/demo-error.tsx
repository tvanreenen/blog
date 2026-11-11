import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function DemoError({
  title,
  children,
  retry,
  action = "Try again",
}: {
  title: string;
  children: React.ReactNode;
  retry?: () => void;
  action?: string;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{children}</p>
        {retry && (
          <Button variant="outline" size="sm" onClick={retry}>
            {action}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
