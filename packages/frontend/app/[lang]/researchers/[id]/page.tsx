"use client";

import { useState, useEffect } from "react";
import PublicationList from "../../../components/PublicationList";
import type { Locale, Researcher } from "@/app/types";
import { getDictionary } from "@/app/dictionaries";
import { ExternalLink } from "lucide-react";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { api } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define a schema for the researcher data
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
    formState: { isValid }
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

      // Update form values
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
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-primary rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <ImageWithFallback
              src={researcher.photo}
              alt={`${researcher.name[lang]} ${researcher.lastName[lang]}`}
              width={250}
              height={250}
              className="rounded-full mb-4 md:mb-0"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                {researcher.name[lang]} {researcher.lastName[lang]}
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-3">
                {researcher.position[lang]}
              </p>
              <p className="text-md text-gray-700 dark:text-gray-300 mb-3">
                <span className="font-medium">{dictionary.publications.citations}:</span> {researcher.totalCitations}
              </p>
              <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries(researcher.profiles).map(
                  ([key, value]) =>
                    value && (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        {key}
                        <ExternalLink size={14} className="ml-1" />
                      </a>
                    ),
                )}
              </div>
              <div
                className="prose max-w-none dark:prose-invert text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: researcher.bio[lang] }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          {dictionary.researchers.significantPublications}
        </h2>
        <div className="bg-white dark:bg-primary rounded-lg shadow-lg p-6">
          <PublicationList lang={lang} publications={researcher.publications} />
        </div>
      </div>
    </div>
  );
}
