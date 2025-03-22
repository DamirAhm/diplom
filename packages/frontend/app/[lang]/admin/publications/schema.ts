import * as z from "zod";

export const localizedStringSchema = z.object({
    en: z.string().min(1, { message: "English translation is required" }),
    ru: z.string().min(1, { message: "Russian translation is required" }),
});

// Schema for researcher profiles
const researcherProfilesSchema = z.object({
    researchgate: z.string().url({ message: "Must be a valid URL" }).nullable().optional(),
    googleScholar: z.string().url({ message: "Must be a valid URL" }).nullable().optional(),
    scopus: z.string().url({ message: "Must be a valid URL" }).nullable().optional(),
    publons: z.string().url({ message: "Must be a valid URL" }).nullable().optional(),
    orcid: z.string().url({ message: "Must be a valid URL" }).nullable().optional(),
});

// Schema for researchers (used in publication.authors)
export const researcherSchema = z.object({
    id: z.number(),
    name: localizedStringSchema,
    lastName: localizedStringSchema,
    title: localizedStringSchema,
    bio: localizedStringSchema,
    photo: z.string(),
    profiles: researcherProfilesSchema,
});

// Schema for publications with authors as Researcher objects
export const publicationSchema = z.object({
    id: z.number().optional(), // Optional for new publications
    title: localizedStringSchema,
    authors: z.array(researcherSchema),
    publishedAt: z.string(), // ISO date string
    journal: z.string(),
    link: z.string().url({ message: "Must be a valid URL" }),
});

// Schema for publication form data (with authors as IDs)
export const publicationFormSchema = z.object({
    title: localizedStringSchema,
    authors: z.array(z.number()), // Array of researcher IDs for form submission
    publishedAt: z.string(), // ISO date string
    journal: z.string(),
    link: z.string().url({ message: "Must be a valid URL" }),
});

export type PublicationData = z.infer<typeof publicationSchema>;
export type PublicationFormData = z.infer<typeof publicationFormSchema>; 