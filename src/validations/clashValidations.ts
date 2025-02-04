import { z } from "zod";

export const clashSchema = z.object({
   title: z
      .string({ message: "Title is required" })
      .min(3, { message: "Title must be at least 3 characters long" })
      .max(100, { message: "Title cannot be greater then 100 characters" }),
   description: z
      .string({ message: "Description is required" })
      .min(3, { message: "Description must be at least 3 characters long" })
      .max(1000, {
         message: "Description cannot be greater then 500 characters",
      }),
   expires_at: z
      .string({ message: "Expire date is required" })
      .min(5, { message: "Date is invalid" }),
   image: z.string().optional(),
});
