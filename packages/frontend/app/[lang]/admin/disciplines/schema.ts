import * as z from "zod";

export const localizedStringSchema = z.object({
    en: z.string().min(1, { message: "English translation is required" }),
    ru: z.string().min(1, { message: "Russian translation is required" }),
});

export const disciplineResearcherSchema = z.object({
    id: z.number(),
    name: localizedStringSchema,
});

export const disciplineSchema = z.object({
    title: localizedStringSchema,
    description: localizedStringSchema,
    researchers: z.array(disciplineResearcherSchema).min(1, {
        message: "At least one researcher is required"
    }),
    image: z.string().min(1, { message: "Image is required" }),
});

export type DisciplineFormData = z.infer<typeof disciplineSchema>; 