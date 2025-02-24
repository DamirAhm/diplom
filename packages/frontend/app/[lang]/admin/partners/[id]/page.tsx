"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale, Partner } from "@/app/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../../../../lib/api";

const emptyPartner: Omit<Partner, "id"> = {
  name: { en: "", ru: "" },
  type: "university",
  logo: "",
  url: "",
};

export default function PartnerFormPage({
  params: { lang, id },
}: {
  params: { lang: Locale; id: string };
}) {
  const dictionary = getDictionary(lang);
  const router = useRouter();
  const { toast } = useToast();
  const [partner, setPartner] = useState<Omit<Partner, "id">>(emptyPartner);
  const [isLoading, setIsLoading] = useState(id !== "new");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id !== "new") {
      fetchPartner();
    }
  }, [id]);

  const fetchPartner = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/partners/${id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setPartner(data);
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
      if (id !== "new") {
        await api.partners.update(id, partner);
      } else {
        await api.partners.create(partner);
      }

      toast({
        title: dictionary.admin.success,
        description: dictionary.admin.saveSuccess,
      });
      router.push(`/${lang}/admin/partners`);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8080/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setPartner((prev) => ({
          ...prev,
          logo: data.url,
        }));
      } else {
        throw new Error();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description: dictionary.admin.uploadError,
      });
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
          onClick={() => router.push(`/${lang}/admin/partners`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {dictionary.common.back}
        </Button>
      </div>

      <h1 className="mb-8 text-3xl font-bold">
        {id === "new"
          ? dictionary.admin.addPartner
          : dictionary.admin.editPartner}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div>
            <Label>{dictionary.admin.name}</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nameEn" className="text-xs">
                  English
                </Label>
                <Input
                  id="nameEn"
                  value={partner.name.en}
                  onChange={(e) =>
                    setPartner((prev) => ({
                      ...prev,
                      name: { ...prev.name, en: e.target.value },
                    }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameRu" className="text-xs">
                  Russian
                </Label>
                <Input
                  id="nameRu"
                  value={partner.name.ru}
                  onChange={(e) =>
                    setPartner((prev) => ({
                      ...prev,
                      name: { ...prev.name, ru: e.target.value },
                    }))
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="type">{dictionary.admin.type}</Label>
            <Select
              value={partner.type}
              onValueChange={(value: "university" | "enterprise") =>
                setPartner((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="university">
                  {dictionary.partners.universities}
                </SelectItem>
                <SelectItem value="enterprise">
                  {dictionary.partners.enterprises}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="logo">{dictionary.admin.photo}</Label>
            <div className="flex items-center gap-4">
              {partner.logo && (
                <img
                  src={partner.logo}
                  alt={partner.name[lang]}
                  className="h-20 w-20 object-contain"
                />
              )}
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={partner.url}
              onChange={(e) =>
                setPartner((prev) => ({ ...prev, url: e.target.value }))
              }
              required
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
