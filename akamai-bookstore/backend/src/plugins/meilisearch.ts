import fp from 'fastify-plugin'
import { MeiliSearch } from 'meilisearch'
import { FastifyPluginAsync } from 'fastify'
import { config } from '../config.js'

const meilisearchPlugin: FastifyPluginAsync = async (fastify) => {
  const client = new MeiliSearch({
    host: config.MEILI_HOST,
    apiKey: config.MEILI_MASTER_KEY,
  })
  fastify.decorate('meilisearch', client)
}

export default fp(meilisearchPlugin, { name: 'meilisearch' })
