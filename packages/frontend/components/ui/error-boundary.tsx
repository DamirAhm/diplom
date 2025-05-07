"use client";

import React from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "./button";
import { Alert, AlertTitle, AlertDescription } from "./alert";
import { RefreshCcw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  lang: Locale;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    const dictionary = getDictionary(this.props.lang);

    if (this.state.hasError) {
      return (
        <div className="flex h-[50vh] items-center justify-center bg-background">
          <Alert className="max-w-lg" variant="destructive">
            <AlertTitle className="text-destructive-foreground">
              {dictionary.common.errorBoundary.title}
            </AlertTitle>
            <AlertDescription className="text-destructive-foreground">
              <p className="mb-4">
                {dictionary.common.errorBoundary.description}
              </p>
              {this.state.error && (
                <pre className="mb-4 max-h-32 overflow-auto rounded bg-destructive/10 p-2 text-xs text-destructive-foreground">
                  {this.state.error.message}
                </pre>
              )}
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                {dictionary.common.errorBoundary.retry}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}
