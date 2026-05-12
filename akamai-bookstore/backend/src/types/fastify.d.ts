import { PostgresDb } from '@fastify/postgres'
import { FastifyRedis } from '@fastify/redis'
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
    redis: FastifyRedis
    meilisearch: MeiliSearch
    verifyJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }

  interface FastifyRequest {
    user: JWTPayload
  }
}
