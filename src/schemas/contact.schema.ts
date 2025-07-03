/**
 * Contact form schema for validation and typing
 */
import { z } from "zod";

/**
 * Schema for contact form submission
 */
export const contactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email is required"),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
