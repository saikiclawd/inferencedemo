import fp from 'fastify-plugin'
import fastifyPostgres from '@fastify/postgres'
import { FastifyPluginAsync } from 'fastify'
import { config } from '../config.js'

const postgresPlugin: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyPostgres, {
    connectionString: `postgresql://${config.POSTGRES_USER}:${config.POSTGRES_PASSWORD}@${config.POSTGRES_HOST}:${config.POSTGRES_PORT}/${config.POSTGRES_DB}`,
  })
}

export default fp(postgresPlugin, { name: 'postgres' })
