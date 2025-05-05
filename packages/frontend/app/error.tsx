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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex items-center justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
          {dictionary.common.error}
        </h1>

        <p className="mb-6 text-center text-gray-600">
          {error?.message || dictionary.common.errorBoundary.unexpectedError}
        </p>

        {error.digest && (
          <div className="mb-6 overflow-auto rounded bg-gray-100 p-3">
            <code className="text-xs text-gray-800">
              {dictionary.common.errorBoundary.details}: {error.digest}
            </code>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <Button onClick={reset} className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" />
            {dictionary.common.errorBoundary.retry}
          </Button>

          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              <Home className="mr-2 h-4 w-4" />
              {dictionary.common.backToDashboard}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
