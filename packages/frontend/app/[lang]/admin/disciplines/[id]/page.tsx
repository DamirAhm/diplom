"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react";
import { DisciplineFormData, disciplineSchema } from "../schema";
import { api } from "@/lib/api";
import { Form, FormMessage } from "@/components/ui/form";
import { LocalizedTextField } from "@/components/ui/form-fields";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Researcher } from "@/app/types";
import { ResearcherSelector } from "@/components/ui/researcher-selector";
import { PhotoUpload } from "@/components/ui/photo-upload";

// Interface for the simplified researcher representation used in disciplines
interface DisciplineResearcher {
    id: number;
    name: {
        en: string;
        ru: string;
    };
}

const emptyForm: DisciplineFormData = {
    title: { en: "", ru: "" },
    description: { en: "", ru: "" },
    researchers: [],
    image: "",
};

export default function DisciplineFormPage({
    params: { lang, id },
}: {
    params: { lang: Locale; id: string };
}) {
    const dictionary = getDictionary(lang);
    const router = useRouter();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(id !== "new");
    const [researchers, setResearchers] = useState<Researcher[]>([]);
    const [selectedResearchers, setSelectedResearchers] = useState<Set<number>>(new Set());
    const [showResearcherSelector, setShowResearcherSelector] = useState(false);

    const form = useForm<DisciplineFormData>({
        resolver: zodResolver(disciplineSchema),
        defaultValues: emptyForm,
        mode: "onBlur",
    });

    const { setValue, watch, reset, formState } = form;
    const formResearchers = watch("researchers");
    const imageUrl = watch("image");

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch all researchers for the selection
                const allResearchers = await api.researchers.getAll();
                setResearchers(allResearchers);

                if (id !== "new") {
                    const discipline = await api.disciplines.getOne(id);
                    reset(discipline);

                    // Track selected researchers
                    const selectedIds = new Set(discipline.researchers.map(r => r.id));
                    setSelectedResearchers(selectedIds);
                } else {
                    // Initialize with empty set for new discipline
                    setSelectedResearchers(new Set());
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

        fetchData();
    }, [id, reset, toast, dictionary]);

    const onSubmit = form.handleSubmit(async (data: DisciplineFormData) => {
        try {
            if (id === "new") {
                await api.disciplines.create(data);
            } else {
                await api.disciplines.update(id, data);
            }

            toast({
                title: dictionary.admin.success,
                description: dictionary.admin.saveSuccess,
            });
            router.push(`/${lang}/admin/disciplines`);
        } catch (error) {
            toast({
                variant: "destructive",
                title: dictionary.common.error,
                description: dictionary.admin.saveError,
            });
        }
    });

    const handlePhotoChange = (url: string) => {
        setValue("image", url);
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
                    onClick={() => router.push(`/${lang}/admin/disciplines`)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {dictionary.common.back}
                </Button>
            </div>

            <h1 className="mb-8 text-3xl font-bold">
                {id === "new"
                    ? dictionary.admin.addDiscipline || "Add Discipline"
                    : dictionary.admin.editDiscipline || "Edit Discipline"}
            </h1>

            <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-8">
                    {formState.errors.root && (
                        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                            {formState.errors.root.message}
                        </div>
                    )}

                    <div className="space-y-4">
                        <LocalizedTextField
                            name="title"
                            label={dictionary.admin.title || "Title"}
                            required
                            lang={lang}
                        />

                        <LocalizedTextField
                            name="description"
                            label={dictionary.admin.description || "Description"}
                            multiline
                            required
                            lang={lang}
                        />

                        <div className="space-y-2">
                            <div className="text-sm font-medium">{dictionary.admin.image || "Image"}</div>
                            <PhotoUpload
                                photoUrl={imageUrl}
                                onPhotoChange={handlePhotoChange}
                                buttonLabel={dictionary.admin.uploadImage || "Upload Image"}
                                errorMessage={dictionary.admin.uploadError}
                                previewSize={200}
                                multiple={false}
                            />
                            <FormField
                                control={form.control}
                                name="image"
                                render={() => (
                                    <FormItem>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                            <FormLabel>
                                {dictionary.admin.researchers || "Researchers"}
                                <span className="text-destructive ml-1">*</span>
                            </FormLabel>

                            <ResearcherSelector
                                researchers={researchers}
                                selectedIds={formResearchers.map(r => r.id)}
                                onChange={(ids) => {
                                    const newResearchers = ids.map(id => {
                                        const researcher = researchers.find(r => r.id === id);
                                        if (!researcher) return null;
                                        return {
                                            id: researcher.id,
                                            name: {
                                                en: `${researcher.name.en} ${researcher.lastName.en}`,
                                                ru: `${researcher.name.ru} ${researcher.lastName.ru}`
                                            }
                                        };
                                    }).filter((r): r is DisciplineResearcher => r !== null);
                                    setValue("researchers", newResearchers);
                                }}
                                lang={lang}
                            />

                            <FormField
                                control={form.control}
                                name="researchers"
                                render={() => (
                                    <FormItem>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={formState.isSubmitting}>
                        {formState.isSubmitting ? dictionary.common.saving : dictionary.common.save}
                    </Button>
                </form>
            </Form>
        </div>
    );
} 