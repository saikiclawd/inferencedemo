import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import { config } from '../config.js'
import type { JWTPayload } from '../types/fastify.js'

const ChatBodySchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string().optional(),
})

const jwksClient = jwksRsa({
  jwksUri: config.KEYCLOAK_JWKS_URI,
  cache: true,
  cacheMaxAge: 600_000,
})

async function verifyWsToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.decode(token, { complete: true })
    if (!decoded?.header?.kid) return null
    const key = await jwksClient.getSigningKey(decoded.header.kid)
    return jwt.verify(token, key.getPublicKey()) as JWTPayload
  } catch {
    return null
  }
}

const assistantRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/api/assistant',
    { websocket: true },
    (connection, req) => {
      const socket = connection.socket

      if (!config.AI_ENABLED) {
        socket.send(JSON.stringify({ type: 'error', message: 'BookBot is disabled for this deployment phase.' }))
        socket.close(1013, 'AI disabled')
        return
      }

      const token = (req.query as Record<string, string>).token

      if (!token) {
        socket.send(JSON.stringify({ type: 'error', message: 'Missing token' }))
        socket.close(4001, 'Unauthorized')
        return
      }

      socket.on('message', async (rawMessage: Buffer | ArrayBuffer | Buffer[]) => {
        let parsed: { message: string; sessionId?: string }
        try {
          parsed = JSON.parse(rawMessage.toString())
        } catch {
          socket.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }))
          return
        }

        const user = await verifyWsToken(token)
        if (!user) {
          socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }))
          socket.close(4001, 'Unauthorized')
          return
        }

        try {
          const response = await fetch(`${config.AI_SERVICE_URL}/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: parsed.message,
              session_id: parsed.sessionId ?? 'anonymous',
              user_id: user.sub,
            }),
          })

          if (!response.ok || !response.body) {
            socket.send(JSON.stringify({ type: 'error', message: 'AI service error' }))
            return
          }

          const reader = response.body.getReader()
          const decoder = new TextDecoder()

          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              socket.send(JSON.stringify({ type: 'done' }))
              break
            }

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6))
                  if (data.token) {
                    socket.send(JSON.stringify({ type: 'token', content: data.token }))
                  }
                } catch {
                  // skip malformed SSE line
                }
              }
            }
          }
        } catch (err) {
          fastify.log.error(err, 'AI service stream error')
          socket.send(JSON.stringify({ type: 'error', message: 'Internal error' }))
        }
      })
    },
  )

  fastify.post('/api/assistant/chat', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    if (!config.AI_ENABLED) {
      return reply.code(503).send({ error: 'AI service disabled', code: 'AI_DISABLED' })
    }

    const body = ChatBodySchema.parse(request.body)
    const userId = request.user.sub

    const response = await fetch(`${config.AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: body.message,
        session_id: body.sessionId ?? 'default',
        user_id: userId,
      }),
    })

    if (!response.ok) {
      return reply.code(502).send({ error: 'AI service error', code: 'AI_ERROR' })
    }

    const data = await response.json()
    return reply.send({ data })
  })
}

export default assistantRoute
