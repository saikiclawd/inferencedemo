import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('bookstore'),
  POSTGRES_USER: z.string().default('bookstore'),
  POSTGRES_PASSWORD: z.string(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  MEILI_HOST: z.string().url().default('http://localhost:7700'),
  MEILI_MASTER_KEY: z.string(),
  KEYCLOAK_JWKS_URI: z.string().url(),
  KEYCLOAK_REALM: z.string().default('bookstore'),
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_ENABLED: z.coerce.boolean().default(false),
  AKAMAI_OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
  AKAMAI_OBJECT_STORAGE_BUCKET: z.string().optional(),
  AKAMAI_ACCESS_KEY: z.string().optional(),
  AKAMAI_SECRET_KEY: z.string().optional(),
})

export const config = EnvSchema.parse(process.env)

export type Config = z.infer<typeof EnvSchema>
