import dotenv from "dotenv";
import { z } from "zod";

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  CORS_ORIGIN: z.string().default("*"),
  MONGODB_URI: z.string().default("mongodb://localhost:27017/sih_sif_intelligence"),
  JWT_SECRET: z.string().default("sih_2026_ps26165_super_secret_jwt_key_development_only_12345"),
  JWT_EXPIRES_IN: z.string().default("24h"),
  GOOGLE_API_KEY: z.string().default(process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "mock_google_api_key_for_testing"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  EMBEDDING_MODEL: z.string().default("text-embedding-004"),
  PINECONE_API_KEY: z.string().default(process.env.PINECONE_API_KEY || "mock_pinecone_api_key_for_testing"),
  PINECONE_INDEX: z.string().default(process.env.PINECONE_INDEX || "sih-sif-precursors"),
  PINECONE_NAMESPACE: z.string().default(process.env.PINECONE_NAMESPACE || "safety-reports-v1"),
  PINECONE_HOST: z.string().default(process.env.PINECONE_HOST || "https://sih-sif-precursors-mock.pinecone.io"),
  RATE_LIMIT_WINDOW_MS: z.string().default("900000").transform((val) => parseInt(val, 10)),
  RATE_LIMIT_MAX: z.string().default("500").transform((val) => parseInt(val, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
export default env;
