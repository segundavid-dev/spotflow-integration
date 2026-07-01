import 'dotenv/config';
import { z } from 'zod';


const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  // Spotflow API 
  SPOTFLOW_BASE_URL: z.string().optional(),
  SPOTFLOW_API_KEY: z.string().optional(),
  SPOTFLOW_WEBHOOK_SECRET: z.string().optional(),

  PENDING_TIMEOUT_MINUTES: z.coerce.number().int().positive().default(60),
});

const parsed = envSchema.safeParse(process.env);



if (!parsed.success) {
  console.error('Invalid environment variables:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;