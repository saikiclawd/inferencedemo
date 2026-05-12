import { PostgresDb } from '@fastify/postgres'
import Redis from 'ioredis'
import { MeiliSearch } from 'meilisearch'
import { FastifyRequest, FastifyReply } from 'fastify'

export interface JWTPayload {
  sub: string
  email?: string
  name?: string
  preferred_username?: string
  realm_access?: { roles: string[] }
  exp: number
  iat: number
}

declare module 'fastify' {
  interface FastifyInstance {
    pg: PostgresDb & PostgresDb['pool']
    redis: Redis
    meilisearch: MeiliSearch
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user: JWTPayload
  }
}
