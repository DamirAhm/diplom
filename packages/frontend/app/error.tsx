"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary } from "./dictionaries";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dictionary = getDictionary();

  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-3xl font-bold text-card-foreground">
          {dictionary.common.error}
        </h1>

        <p className="mb-6 text-center text-muted-foreground">
          {error?.message || dictionary.common.errorBoundary.unexpectedError}
        </p>

        {error.digest && (
          <div className="mb-6 overflow-auto rounded bg-muted p-3">
            <code className="text-xs text-muted-foreground">
              {dictionary.common.errorBoundary.details}: {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <Button
            onClick={reset}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            {dictionary.common.errorBoundary.retry}
          </Button>

          <Link href="/" className="w-full">
            <Button
              variant="outline"
              className="w-full border-border hover:bg-muted"
            >
              <Home className="mr-2 h-4 w-4" />
              {dictionary.common.backToDashboard}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
