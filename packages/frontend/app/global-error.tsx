"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";
import { getDictionary } from "./dictionaries";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const dictionary = getDictionary();

  useEffect(() => {
    console.error("Global error (SSR):", error);
  }, [error]);

  // Simple styling without component imports for global error
  return (
    <html lang="ru">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#f9fafb",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "28rem",
              backgroundColor: "white",
              borderRadius: "0.5rem",
              padding: "2rem",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  backgroundColor: "#fee2e2",
                  padding: "0.75rem",
                  borderRadius: "9999px",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
            </div>

            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "bold",
                color: "#1f2937",
                textAlign: "center",
                marginBottom: "0.5rem",
              }}
            >
              {dictionary.common.error}
            </h1>

            <p
              style={{
                color: "#4b5563",
                textAlign: "center",
                marginBottom: "1.5rem",
              }}
            >
              {error?.message ||
                dictionary.common.errorBoundary.unexpectedError}
            </p>

            {error.digest && (
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: "0.25rem",
                  padding: "0.75rem",
                  marginBottom: "1.5rem",
                  overflow: "auto",
                }}
              >
                <code style={{ fontSize: "0.75rem", color: "#1f2937" }}>
                  {dictionary.common.errorBoundary.details}: {error.digest}
                </code>
              </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <button
                onClick={reset}
                style={{
                  backgroundColor: "#1d4ed8",
                  color: "white",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "0.5rem" }}
                >
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38" />
                </svg>
                {dictionary.common.errorBoundary.retry}
              </button>

              <a
                href="/"
                style={{
                  backgroundColor: "white",
                  color: "#111827",
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  border: "1px solid #d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textDecoration: "none",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: "0.5rem" }}
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                {dictionary.common.backToDashboard}
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
