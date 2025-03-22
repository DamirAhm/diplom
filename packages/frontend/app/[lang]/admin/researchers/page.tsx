"use client";

import { useState, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, Researcher } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Column, DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "../../../../lib/api";
import { useParams } from "next/navigation";

export default function ResearchersAdminPage() {
  const { lang } = useParams<{ lang: Locale }>();
  const dictionary = getDictionary(lang);
  const { toast } = useToast();
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Researcher[]>([]);

  useEffect(() => {
    fetchResearchers();
  }, []);

  const fetchResearchers = async () => {
    try {
      const data = await api.researchers.getAll();

      setResearchers(data);
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

  const handleDelete = async (items: Researcher[]) => {
    setItemsToDelete(items);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const promises = itemsToDelete.map((researcher) =>
        api.researchers.delete(researcher.id.toString())
      );

      await Promise.all(promises);

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.deleteSuccess,
      });

      fetchResearchers();
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

  const columns: Column<Researcher>[] = [
    {
      header: dictionary.admin.name,
      accessorKey: (researcher) => `${researcher.name[lang]} ${researcher.lastName[lang]}`,
      sortable: true,
    },
    {
      header: dictionary.admin.bio,
      accessorKey: (researcher) => researcher.bio[lang],
      sortable: true,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{dictionary.admin.researchers}</h1>
        <Link href={`/${lang}/admin/researchers/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dictionary.admin.addResearcher}
          </Button>
        </Link>
      </div>

      <DataTable
        data={researchers}
        columns={columns}
        isLoading={isLoading}
        identifier={(researcher) => researcher.id}
        onDelete={handleDelete}
        searchPlaceholder={dictionary.admin.searchResearchers}
        tableId="researchers"
        lang={lang}
        editPath={(researcher) => `/${lang}/admin/researchers/${researcher.id}`}
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
