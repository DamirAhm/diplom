"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, Researcher } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { PublicationFormData, publicationFormSchema } from "../schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import {
  TextField,
  LocalizedTextField,
  MultiSelectField,
  ExternalAuthorsField
} from "@/components/ui/form-fields";

const emptyPublication: PublicationFormData = {
  title: { en: "", ru: "" },
  authors: [],
  externalAuthors: [],
  publishedAt: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
  journal: "",
  link: "",
};

export default function PublicationFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [researchersLoading, setResearchersLoading] = useState(true);

  const form = useForm<PublicationFormData>({
    resolver: zodResolver(publicationFormSchema),
    defaultValues: emptyPublication,
  });

  useEffect(() => {
    if (id !== "new") {
      fetchPublication();
    }
    fetchResearchers();
  }, [id]);

  const fetchPublication = async () => {
    try {
      const data = await api.publications.getOne(id);

      const internalAuthors = data.authors
        .filter(author => author.id !== undefined)
        .map(author => author.id!);

      const externalAuthors = data.authors
        .filter(author => author.id === undefined)
        .map(author => author.name);

      form.reset({
        title: data.title,
        authors: internalAuthors,
        externalAuthors: externalAuthors,
        publishedAt: data.publishedAt,
        journal: data.journal,
        link: data.link
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.fetchError,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResearchers = async () => {
    try {
      const data = await api.researchers.getAll();
      setResearchers(data);
    } catch (error) {
      console.error('Error fetching researchers:', error);
    } finally {
      setResearchersLoading(false);
    }
  };

  const onSubmit = async (formData: PublicationFormData) => {
    try {
      const apiData = {
        ...formData,
        authors: [
          ...formData.authors.map(id => ({ id, name: researchers.find(r => r.id === id)?.name })),
          ...formData.externalAuthors.map(name => ({ name }))
        ],
        citationsCount: 0
      };

      delete (apiData as any).externalAuthors;

      if (id !== "new") {
        await api.publications.update(id, apiData as any);
      } else {
        await api.publications.create(apiData as any);
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.saveSuccess,
      });
      router.push(`/${lang}/admin/publications`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.saveError,
      });
    }
  };

  const getResearcherName = (id: number): string => {
    const researcher = researchers.find(r => r.id === id);
    if (!researcher) return "";
    return `${researcher.name[lang]} ${researcher.lastName[lang]}`;
  };

  if (isLoading || researchersLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const researcherOptions = researchers.map(researcher => ({
    value: researcher.id.toString(),
    label: `${researcher.name[lang]} ${researcher.lastName[lang]}`
  }));

  return (
    <div>
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/${lang}/admin/publications`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {dictionary.common.back}
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">
        {id === "new"
          ? dictionary.admin.addPublication
          : dictionary.admin.editPublication}
      </h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <LocalizedTextField
              name="title"
              label={dictionary.admin.title}
              required
              lang={lang}
            />

            <MultiSelectField
              name="authors"
              label={dictionary.publications.authors}
              options={researcherOptions}
            />

            <ExternalAuthorsField
              name="externalAuthors"
              label={dictionary.publications.externalAuthors}
            />

            <TextField
              name="publishedAt"
              label={dictionary.publications.publishedAt}
              type="date"
              required
            />

            <TextField
              name="journal"
              label={dictionary.publications.journal}
              required
            />

            <TextField
              name="link"
              label="URL"
              type="url"
            />
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? dictionary.common.saving : dictionary.common.save}
          </Button>
        </form>
      </Form>
    </div>
  );
}