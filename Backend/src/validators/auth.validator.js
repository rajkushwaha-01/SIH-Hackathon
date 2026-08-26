import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .trim(),
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password cannot exceed 128 characters"),
  role: z
    .enum(["ADMIN", "HSE_OFFICER", "REVIEWER", "VIEWER"], {
      errorMap: () => ({ message: "Role must be one of: ADMIN, HSE_OFFICER, REVIEWER, VIEWER" }),
    })
    .optional()
    .default("HSE_OFFICER"),
  site: z.string().trim().optional().default("All Sites"),
  department: z.string().trim().optional().default("HSE"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address")
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});

export default {
  registerSchema,
  loginSchema,
};
