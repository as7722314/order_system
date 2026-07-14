import { z } from "zod";

export const storeStatusSchema = z.object({
  isOpen: z.boolean()
});