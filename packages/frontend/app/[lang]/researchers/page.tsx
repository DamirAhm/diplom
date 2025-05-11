"use client";

import { useState, useEffect } from "react";
import ResearcherCard from "../../components/ResearcherCard";
import { Locale, ResearcherWithCount } from "../../types";
import { getDictionary } from "../../dictionaries";
import { api } from "@/lib/api";

export default function ResearchersPage({
  params,
}: {
  params: { lang: Locale };
}) {
  const [researchers, setResearchers] = useState<ResearcherWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { lang } = params || {};
  const dictionary = getDictionary(lang);

  useEffect(() => {
    const fetchResearchers = async () => {
      try {
        const data = await api.researchers.getAll();
        setResearchers(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch researchers:", error);
        setIsLoading(false);
      }
    };

    fetchResearchers();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-6 dark:text-white">
          {dictionary.researchers.title}
        </h1>
        <p className="text-foreground/70 max-w-3xl mx-auto">
          {lang === "en"
            ? "Meet our team of expert researchers driving innovation and discovery in our laboratory."
            : "Познакомьтесь с нашей командой экспертов-исследователей, способствующих инновациям и открытиям в нашей лаборатории."}
        </p>
      </div>

      {/* Stats Summary */}
      <div className="max-w-5xl mx-auto mb-10 bg-card dark:bg-card border border-border/50 dark:border-indigo-400/20 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold dark:text-indigo-400">
              {researchers.length}
            </div>
            <div className="text-sm text-foreground/70">
              {lang === "en" ? "Researchers" : "Исследователи"}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold dark:text-indigo-400">
              {researchers.length > 0
                ? Math.round(
                  researchers.reduce((acc, r) => acc + r.totalCitations, 0) /
                  researchers.length
                )
                : 0}
            </div>
            <div className="text-sm text-foreground/70">
              {lang === "en" ? "Avg. Citations" : "Средн. цитируемость"}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold dark:text-indigo-400">
              {researchers.length > 0
                ? Math.round(
                  researchers.reduce((acc, r) => acc + r.hIndex, 0) /
                  researchers.length
                )
                : 0}
            </div>
            <div className="text-sm text-foreground/70">
              {lang === "en" ? "Avg. h-index" : "Средн. h-индекс"}
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold dark:text-indigo-400">
              {researchers.reduce(
                (acc, r) => acc + (r.publicationsCount || 0),
                0
              )}
            </div>
            <div className="text-sm text-foreground/70">
              {lang === "en" ? "Publications" : "Публикации"}
            </div>
          </div>
        </div>
      </div>

      {/* Researchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {isLoading ? (
          // Loading skeleton
          Array(6)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 dark:border-indigo-400/20 animate-pulse"
              >
                <div className="aspect-[4/3] bg-muted/50"></div>
                <div className="p-6">
                  <div className="h-6 bg-muted/50 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-muted/50 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-muted/50 rounded w-1/4 mb-6"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-muted/50 rounded w-16"></div>
                    <div className="h-6 bg-muted/50 rounded w-16"></div>
                  </div>
                  <div className="h-4 bg-muted/50 rounded w-1/3"></div>
                </div>
              </div>
            ))
        ) : researchers.length > 0 ? (
          researchers.map((researcher) => (
            <ResearcherCard
              key={researcher.id}
              researcher={researcher}
              lang={lang}
            />
          ))
        ) : (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12">
            <p className="text-foreground/70">
              {lang === "en"
                ? "No researchers found."
                : "Исследователи не найдены."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
