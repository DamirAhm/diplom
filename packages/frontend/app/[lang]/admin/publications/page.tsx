"use client";

import { useState, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, Publication, Researcher } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Pencil, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Column, DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "@/lib/api";

export default function PublicationsAdminPage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const { toast } = useToast();
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Publication[]>([]);

  useEffect(() => {
    fetchPublications();
  }, []);

  const fetchPublications = async () => {
    try {
      const data = await api.publications.getAll();
      setPublications(data);
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

  const handleDelete = async (items: Publication[]) => {
    setItemsToDelete(items);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await Promise.all(
        itemsToDelete.map((item) => api.publications.delete(item.id.toString()))
      );

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.deleteSuccess,
      });

      fetchPublications();
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.deleteError,
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemsToDelete([]);
    }
  };

  // Helper function to get author names from author objects
  const getAuthorNames = (authors: Researcher[]) => {
    return authors
      ? authors
        .map(author => `${author.name[lang]} ${author.lastName[lang]}`)
        .join(', ')
      : '';
  };

  const columns: Column<Publication>[] = [
    {
      header: dictionary.admin.title,
      accessorKey: (publication: Publication) => publication.title[lang],
      sortable: true,
      className: "w-1/3",
    },
    {
      header: dictionary.publications.authors,
      accessorKey: (publication: Publication) => getAuthorNames(publication.authors),
      sortable: true,
    },
    {
      header: dictionary.publications.journal,
      accessorKey: "journal",
      sortable: true,
      className: "w-1/4",
    },
    {
      header: dictionary.publications.publishedAt,
      accessorKey: "publishedAt",
      sortable: true,
      className: "w-20",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{dictionary.admin.publications}</h1>
        <Link href={`/${lang}/admin/publications/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dictionary.admin.addPublication}
          </Button>
        </Link>
      </div>

      <DataTable
        data={publications}
        columns={columns}
        isLoading={isLoading}
        identifier={(publication) => publication.id}
        onDelete={handleDelete}
        searchPlaceholder={dictionary.admin.searchPublications}
        tableId="publications"
        lang={lang}
        editPath={(publication) => `/${lang}/admin/publications/${publication.id}`}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        lang={lang}
      />
    </div>
  );
}
