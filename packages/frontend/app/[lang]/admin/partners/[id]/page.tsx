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
import { FormError } from "@/components/ui/form-error";
import { useFormValidation, ValidationSchema } from "@/lib/form-validation";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { createPartner, updatePartner } from "../../actions";

const emptyPartner: Omit<Partner, "id"> = {
  name: "",
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

  const validation = useFormValidation();

  useEffect(() => {
    if (id !== "new") {
      fetchPartner();
    }
  }, [id]);

  const fetchPartner = async () => {
    try {
      const data = await api.partners.getOne(id);
      setPartner(data);
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

  const getValidationSchema = (): ValidationSchema => {
    return {
      name: {
        value: partner.name,
        rules: { required: true },
        errorMessage: dictionary.validation?.required || "Name is required",
      },
      url: {
        value: partner.url,
        rules: { required: true, url: true },
        errorMessage:
          dictionary.validation?.invalidUrl || "Valid URL is required",
      },
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.validate(getValidationSchema())) {
      toast({
        variant: "destructive",
        title: dictionary.common.error,
        description:
          dictionary.validation?.formErrors ||
          "Please correct the errors in the form",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (id !== "new") {
        await updatePartner(id, partner, lang);
      } else {
        await createPartner(partner, lang);
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

  const handlePhotoChange = (url: string) => {
    setPartner((prev) => ({
      ...prev,
      logo: url,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const { errors } = validation;

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
            <Label htmlFor="name">
              {dictionary.admin.name}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="name"
              value={partner.name}
              onChange={(e) =>
                setPartner((prev) => ({ ...prev, name: e.target.value }))
              }
              className={errors.name ? "border-destructive" : ""}
            />
            <FormError message={errors.name} />
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
            <PhotoUpload
              photoUrl={partner.logo}
              onPhotoChange={handlePhotoChange}
              buttonLabel={dictionary.admin.uploadPhoto || "Upload photo"}
              errorMessage={dictionary.admin.uploadError}
              multiple={false}
            />
          </div>

          <div>
            <Label htmlFor="url">
              URL
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Input
              id="url"
              type="url"
              value={partner.url}
              onChange={(e) =>
                setPartner((prev) => ({ ...prev, url: e.target.value }))
              }
              className={errors.url ? "border-destructive" : ""}
            />
            <FormError message={errors.url} />
          </div>
        </div>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? dictionary.common.saving : dictionary.common.save}
        </Button>
      </form>
    </div>
  );
}
