import * as z from "zod";
import { localizedStringSchema } from "../researchers/schema";

const videoSchema = z.object({
  id: z.number(),
  title: localizedStringSchema,
  url: z.string().url({ message: "Must be a valid URL" }),
});

export const projectSchema = z.object({
  title: localizedStringSchema,
  description: localizedStringSchema,
  githubLink: z.string().url({ message: "Must be a valid URL" }).optional(),
  publications: z.array(z.any()).optional(),
  videos: z.array(videoSchema).optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;