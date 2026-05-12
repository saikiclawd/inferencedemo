import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import { FastifyPluginAsync } from 'fastify'
import { config } from '../config.js'

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  const redis = new Redis(config.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: false,
    family: 4,
    connectTimeout: 10_000,
    maxRetriesPerRequest: 3,
  })

  fastify.decorate('redis', redis)
  fastify.addHook('onClose', async () => {
    await redis.quit().catch(() => redis.disconnect())
  })
}

export default fp(redisPlugin, { name: 'redis' })
