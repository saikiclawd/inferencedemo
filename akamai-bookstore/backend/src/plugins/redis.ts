import fp from 'fastify-plugin'
import fastifyRedis from '@fastify/redis'
import { FastifyPluginAsync } from 'fastify'
import { config } from '../config.js'

const redisPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyRedis, {
    url: config.REDIS_URL,
    family: 4,
    connectTimeout: 10_000,
    maxRetriesPerRequest: 3,
  })
}

export default fp(redisPlugin, { name: 'redis' })
