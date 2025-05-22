"use client";

import { useState, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Discipline } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Column, DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { api } from "../../../../lib/api";
import { useParams } from "next/navigation";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { deleteDiscipline } from "../actions";

export default function DisciplinesAdminPage() {
  const { lang } = useParams<{ lang: Locale }>();
  const dictionary = getDictionary(lang);
  const { toast } = useToast();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Discipline[]>([]);

  useEffect(() => {
    fetchDisciplines();
  }, []);

  const fetchDisciplines = async () => {
    try {
      setIsLoading(true);
      const data = await api.disciplines.getAll();
      setDisciplines(data);
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

  const handleDelete = async (items: Discipline[]) => {
    setItemsToDelete(items);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      for (const item of itemsToDelete) {
        await deleteDiscipline(item.id.toString(), lang);
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.deleteSuccess,
      });

      fetchDisciplines();
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

  const columns: Column<Discipline>[] = [
    {
      header: dictionary.admin.image || "Image",
      accessorKey: "image",
      sortable: false,
      cell: (r) => {
        return (
          <ImageWithFallback
            src={r?.image}
            alt={r?.title[lang]}
            width={80}
            height={80}
            className="rounded-md"
          />
        );
      },
    },
    {
      header: dictionary.admin.title || "Title",
      accessorKey: (discipline) => discipline.title[lang],
      sortable: true,
    },
    {
      header: dictionary.admin.researchers || "Researchers",
      accessorKey: (discipline) =>
        discipline.researchers.map((r) => r.name[lang]).join(", "),
      sortable: false,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {dictionary.admin.disciplines || "Disciplines"}
        </h1>
        <Link href={`/${lang}/admin/disciplines/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dictionary.admin.addDiscipline || "Add Discipline"}
          </Button>
        </Link>
      </div>

      <DataTable
        data={disciplines}
        columns={columns}
        isLoading={isLoading}
        identifier={(discipline) => discipline.id}
        onDelete={handleDelete}
        searchPlaceholder={
          dictionary.admin.searchDisciplines || "Search disciplines..."
        }
        tableId="disciplines"
        lang={lang}
        editPath={(discipline) => `/${lang}/admin/disciplines/${discipline.id}`}
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
