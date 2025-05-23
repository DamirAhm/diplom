"use client";

import { useState, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, Partner } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Column, DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import { api } from "../../../../lib/api";
import { deletePartner } from "../actions";

export default function PartnersAdminPage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const { toast } = useToast();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<Partner[]>([]);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const data = await api.partners.getAll();

      setPartners(data.universities.concat(data.enterprises));
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

  const handleDelete = async (items: Partner[]) => {
    setItemsToDelete(items);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      for (const item of itemsToDelete) {
        await deletePartner(item.id.toString(), lang);
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.deleteSuccess,
      });

      fetchPartners();
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

  const columns: Column<Partner>[] = [
    {
      header: dictionary.admin.photo,
      accessorKey: (partner: Partner) => (
        <div className="h-12 w-12">
          <ImageWithFallback
            src={partner.logo}
            alt={partner.name}
            width={48}
            height={48}
            className="object-contain"
          />
        </div>
      ),
      className: "w-[100px]",
    },
    {
      header: dictionary.admin.name,
      accessorKey: (partner: Partner) => partner.name,
      sortable: true,
    },
    {
      header: dictionary.admin.type,
      accessorKey: (partner: Partner) =>
        dictionary.partners[
          partner.type === "university" ? "universities" : "enterprises"
        ],
      sortable: true,
    },
    {
      header: dictionary.admin.url,
      accessorKey: (partner: Partner) => (
        <a
          href={partner.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {partner.url}
        </a>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{dictionary.admin.partners}</h1>
        <Link href={`/${lang}/admin/partners/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {dictionary.admin.addPartner}
          </Button>
        </Link>
      </div>

      <DataTable
        data={partners}
        columns={columns}
        isLoading={isLoading}
        identifier={(partner) => partner.id}
        onDelete={handleDelete}
        searchPlaceholder={dictionary.common.search}
        tableId="partners"
        lang={lang}
        editPath={(partner) => `/${lang}/admin/partners/${partner.id}`}
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
