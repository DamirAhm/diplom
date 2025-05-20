"use client";

import { useState, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, TrainingMaterial } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { ImagePreview } from "@/app/components/ImagePreview";
import { ImageWithFallback } from "../../../components/ImageWithFallback";
import { deleteTraining } from "../actions";

export default function TrainingAdminPage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const { toast } = useToast();
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<TrainingMaterial[]>([]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const data = await api.training.getAll();
      setMaterials(data);
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

  const handleDelete = async (items: TrainingMaterial[]) => {
    setItemsToDelete(items);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      for (const item of itemsToDelete) {
        await deleteTraining(item.id.toString(), lang);
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.deleteSuccess,
      });

      fetchMaterials();
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

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "tutorial":
        return "bg-blue-500";
      case "documentation":
        return "bg-green-500";
      case "video":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const columns = [
    {
      header: dictionary.admin.title,
      accessorKey: (material: TrainingMaterial) => material.title[lang],
      sortable: true,
    },
    {
      header: dictionary.admin.description,
      accessorKey: (material: TrainingMaterial) => material.description[lang],
      sortable: true,
      className: "max-w-md truncate",
    },
    {
      header: dictionary.admin.url,
      accessorKey: (material: TrainingMaterial) => (
        <a
          href={material.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          {material.url}
        </a>
      ),
      sortable: true,
      className: "max-w-md truncate",
    },
    {
      header: dictionary.admin.image,
      accessorKey: (material: TrainingMaterial) =>
        material.image ? (
          <div className="flex items-center justify-center relative w-12 h-12 flex-shrink-0 overflow-hidden">
            <ImageWithFallback
              src={material.image}
              alt={material.title[lang]}
              width={48}
              height={48}
              className="rounded object-cover w-full h-full"
            />
          </div>
        ) : (
          <span className="text-muted-foreground">No image</span>
        ),
      sortable: true,
      className: "w-[100px]",
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{dictionary.admin.training}</h1>
        <Link href={`/${lang}/admin/training/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dictionary.admin.addTraining}
          </Button>
        </Link>
      </div>

      <DataTable
        data={materials}
        columns={columns}
        isLoading={isLoading}
        identifier={(material) => material.id}
        onDelete={handleDelete}
        searchPlaceholder={dictionary.common.search}
        tableId="training"
        lang={lang}
        editPath={(material) => `/${lang}/admin/training/${material.id}`}
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
