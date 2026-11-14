import { z } from "zod";

export const compositionSchema = z.object({
  backgroundColor: z.string().default("#080B11"),
  audioVolume: z.number().min(0).max(1).default(1),
  showSubtitles: z.boolean().default(true),
  showSafeZone: z.boolean().default(false),
});

export type CompositionSchema = z.infer<typeof compositionSchema>;
