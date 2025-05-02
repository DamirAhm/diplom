"use client";

import { useState, useEffect } from "react";
import PublicationList from "../../../components/PublicationList";
import type { Locale, Researcher } from "@/app/types";
import { getDictionary } from "@/app/dictionaries";
import { Award, ExternalLink, MessageSquareQuote } from "lucide-react";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";

const researcherSchema = z.object({
  id: z.number(),
  name: z.object({
    en: z.string(),
    ru: z.string(),
  }),
  lastName: z.object({
    en: z.string(),
    ru: z.string(),
  }),
  bio: z.object({
    en: z.string(),
    ru: z.string(),
  }),
  photo: z.string(),
  profiles: z.record(z.string().optional()),
  publications: z.array(z.any()),
  position: z.object({
    en: z.string(),
    ru: z.string(),
  }),
  totalCitations: z.number(),
  recentCitations: z.number(),
  hIndex: z.number(),
  recentHIndex: z.number(),
});

type ResearcherData = z.infer<typeof researcherSchema>;

export default function ResearcherPage({
  params: { id, lang },
}: {
  params: { id: string; lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    setValue,
    watch,
    formState: { isValid },
  } = useForm<ResearcherData>({
    resolver: zodResolver(researcherSchema),
    defaultValues: {
      id: 0,
      name: { en: "", ru: "" },
      lastName: { en: "", ru: "" },
      bio: { en: "", ru: "" },
      photo: "",
      profiles: {},
      publications: [],
      position: { en: "", ru: "" },
      totalCitations: 0,
      recentCitations: 0,
      hIndex: 0,
      recentHIndex: 0,
    },
  });

  const researcher = watch();

  useEffect(() => {
    fetchResearcher();
  }, [id]);

  const fetchResearcher = async () => {
    try {
      setIsLoading(true);
      const data = await api.researchers.getOne(id);

      Object.entries(data).forEach(([key, value]) => {
        setValue(key as keyof ResearcherData, value);
      });
    } catch (error) {
      console.error("Failed to fetch researcher:", error);
      setError(dictionary.researchers.notFound);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="text-center mt-8 text-xl">
        {error || dictionary.researchers.notFound}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Breadcrumb */}
      <div className="mb-8">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link
                href={`/${lang}`}
                className="inline-flex items-center text-sm font-medium text-foreground/70 hover:text-primary"
              >
                <svg
                  className="w-3 h-3 mr-2.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                </svg>
                {lang === "en" ? "Home" : "Главная"}
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 text-foreground/70 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <Link
                  href={`/${lang}/researchers`}
                  className="ml-1 text-sm font-medium text-foreground/70 hover:text-primary md:ml-2"
                >
                  {dictionary.researchers.title}
                </Link>
              </div>
            </li>
            <li aria-current="page">
              <div className="flex items-center">
                <svg
                  className="w-3 h-3 text-foreground/70 mx-1"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 6 10"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m1 9 4-4-4-4"
                  />
                </svg>
                <span className="ml-1 text-sm font-medium text-primary md:ml-2">
                  {researcher.name[lang]} {researcher.lastName[lang]}
                </span>
              </div>
            </li>
          </ol>
        </nav>
      </div>

      {/* Researcher Info Section */}
      <div className="bg-card dark:bg-card rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column - Photo */}
            <div className="md:w-1/4">
              <div className="aspect-square rounded-lg overflow-hidden border border-border/50 bg-background dark:bg-background">
                <ImageWithFallback
                  src={researcher.photo}
                  alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
                  width={300}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-foreground/70">
                  {lang === "en" ? "Research Profiles" : "Научные профили"}
                </h3>
                <div className="flex flex-col gap-2">
                  {Object.entries(researcher.profiles).map(
                    ([key, value]) =>
                      value && (
                        <a
                          key={key}
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <ExternalLink size={14} />
                          {key}
                        </a>
                      )
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 py-1">
                  <MessageSquareQuote className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    <span className="font-medium">
                      {dictionary.publications.citations}:
                    </span>{" "}
                    {researcher.totalCitations}
                  </span>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <Award className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    <span className="font-medium">
                      {lang === "en" ? "h-index" : "h-индекс"}:
                    </span>{" "}
                    {researcher.hIndex}
                  </span>
                </div>
              </div>
            </div>

            {/* Right column - Info */}
            <div className="md:w-3/4">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {researcher.name[lang]} {researcher.lastName[lang]}
              </h1>
              <p className="text-lg text-foreground/70 mb-6 pb-4 border-b border-border/50">
                {researcher.position[lang]}
              </p>

              <div className="mt-4">
                <h2 className="text-xl font-semibold mb-3">
                  {lang === "en" ? "About" : "Информация"}
                </h2>
                <div className="prose prose-md max-w-none dark:prose-invert">
                  <div
                    dangerouslySetInnerHTML={{ __html: researcher.bio[lang] }}
                  />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border/50">
                <h2 className="text-xl font-semibold mb-4">
                  {dictionary.researchers.significantPublications}
                </h2>
                <PublicationList
                  lang={lang}
                  publications={researcher.publications}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
