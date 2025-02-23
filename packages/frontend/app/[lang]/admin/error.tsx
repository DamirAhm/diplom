"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { useParams } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const params = useParams<{ lang: Locale }>();

  const dictionary = getDictionary(params?.lang);

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="mb-2 text-2xl font-bold">{dictionary.common.error}</h2>
        <p className="mb-4 text-muted-foreground">
          {error.message || dictionary.common.unexpectedError}
        </p>
        <Button onClick={reset}>{dictionary.common.tryAgain}</Button>
      </div>
    </div>
  );
}
