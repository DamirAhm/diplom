"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, Publication } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const emptyPublication: Omit<Publication, "id"> = {
  title: "",
  authors: "",
  year: new Date().getFullYear(),
  journal: "",
  doi: "",
  url: "",
};

export default function PublicationFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [publication, setPublication] = useState<Omit<Publication, "id">>(emptyPublication);
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id !== "new") {
      fetchPublication();
    }
  }, [id]);

  const fetchPublication = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/publications/${id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPublication(data);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(
        `http://localhost:8080/api/publications${id !== "new" ? `/${id}` : ""}`,
        {
          method: id !== "new" ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(publication),
        }
      );

      if (response.ok) {
        toast({
          title: dictionary.admin.success,
          description: dictionary.admin.saveSuccess,
        });
        router.push(`/${lang}/admin/publications`);
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.saveError,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

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

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">{dictionary.admin.title}</Label>
            <Input
              id="title"
              value={publication.title}
              onChange={(e) =>
                setPublication((prev) => ({ ...prev, title: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="authors">{dictionary.publications.authors}</Label>
            <Input
              id="authors"
              value={publication.authors}
              onChange={(e) =>
                setPublication((prev) => ({ ...prev, authors: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="year">{dictionary.publications.year}</Label>
            <Input
              id="year"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={publication.year}
              onChange={(e) =>
                setPublication((prev) => ({ ...prev, year: parseInt(e.target.value, 10) }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="journal">{dictionary.publications.journal}</Label>
            <Input
              id="journal"
              value={publication.journal}
              onChange={(e) =>
                setPublication((prev) => ({ ...prev, journal: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="doi">DOI</Label>
            <Input
              id="doi"
              value={publication.doi}
              onChange={(e) =>
                setPublication((prev) => ({ ...prev, doi: e.target.value }))
              }
            />
          </div>

          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={publication.url}
              onChange={(e) =>
                setPublication((prev) => ({ ...prev, url: e.target.value }))
              }
            />
          </div>
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? dictionary.common.saving : dictionary.common.save}
        </Button>
      </form>
    </div>
  );
}