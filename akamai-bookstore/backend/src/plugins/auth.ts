import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { config } from '../config.js'
import type { JWTPayload } from '../types/fastify.js'

const authPlugin: FastifyPluginAsync = async (fastify) => {
  const jwksClient = jwksRsa({
    jwksUri: config.KEYCLOAK_JWKS_URI,
    cache: true,
    cacheMaxEntries: 5,
    cacheMaxAge: 600_000,
    rateLimit: true,
  })

  async function verifyJWT(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const authHeader = request.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Unauthorized', code: 'MISSING_TOKEN' })
    }

    const token = authHeader.slice(7)
    const decoded = jwt.decode(token, { complete: true })

    if (!decoded?.header?.kid) {
      return reply.code(401).send({ error: 'Unauthorized', code: 'INVALID_TOKEN' })
    }

    try {
      const key = await jwksClient.getSigningKey(decoded.header.kid)
      const verified = jwt.verify(token, key.getPublicKey()) as JWTPayload
      request.user = verified
    } catch {
      return reply.code(401).send({ error: 'Unauthorized', code: 'TOKEN_EXPIRED' })
    }
  }

  fastify.decorate('verifyJWT', verifyJWT)
}

export default fp(authPlugin, { name: 'auth' })
