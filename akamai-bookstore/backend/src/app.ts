import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import fastifyWebsocket from '@fastify/websocket'

import postgresPlugin from './plugins/postgres.js'
import redisPlugin from './plugins/redis.js'
import meilisearchPlugin from './plugins/meilisearch.js'
import authPlugin from './plugins/auth.js'

import booksRoute from './routes/books.js'
import cartRoute from './routes/cart.js'
import ordersRoute from './routes/orders.js'
import bestsellersRoute from './routes/bestsellers.js'
import searchRoute from './routes/search.js'
import recommendationsRoute from './routes/recommendations.js'
import assistantRoute from './routes/assistant.js'

export function buildApp() {
  const app = Fastify({
    pluginTimeout: 120_000,
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  })

  app.register(fastifyCors, {
    origin: true,
    credentials: true,
  })

  app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  })

  app.register(fastifyRateLimit, {
    max: 200,
    timeWindow: '1 minute',
  })

  app.register(fastifyWebsocket)

  app.register(postgresPlugin)
  app.register(redisPlugin)
  app.register(meilisearchPlugin)
  app.register(authPlugin)

  app.register(booksRoute)
  app.register(cartRoute)
  app.register(ordersRoute)
  app.register(bestsellersRoute)
  app.register(searchRoute)
  app.register(recommendationsRoute)
  app.register(assistantRoute)

  app.get('/health', async (_, reply) => {
    const pgOk = await app.pg.query('SELECT 1').then(() => 'ok').catch(() => 'error')
    const redisOk = app.redis.status === 'ready' ? 'ok' : app.redis.status
    return reply.send({ status: 'ok', postgres: pgOk, redis: redisOk })
  })

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error)

    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.validation,
      })
    }

    const statusCode = error.statusCode ?? 500
    return reply.code(statusCode).send({
      error: statusCode === 500 ? 'Internal server error' : error.message,
      code: 'INTERNAL_ERROR',
    })
  })

  return app
}
