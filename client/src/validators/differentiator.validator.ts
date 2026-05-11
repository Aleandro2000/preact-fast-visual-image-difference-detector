import { z } from "zod/v4";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size <= MAX_FILE_SIZE, "Max file size is 50MB.")
  .refine((f) => ACCEPTED_IMAGE_TYPES.includes(f.type), "Only JPEG, PNG, GIF, WebP are accepted.");

export const differentiatorSchema = z.object({
  beforeImage: imageFileSchema,
  afterImage: imageFileSchema,
  sensitivity: z.number().min(1).max(100),
});

export type DifferentiatorFormData = z.infer<typeof differentiatorSchema>;
