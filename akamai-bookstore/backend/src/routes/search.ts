import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(['price:asc', 'price:desc', 'rating:desc']).optional(),
})

const searchRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/search', async (request, reply) => {
    const query = SearchQuerySchema.parse(request.query)
    const offset = (query.page - 1) * query.pageSize

    const searchParams: Record<string, unknown> = {
      limit: query.pageSize,
      offset,
      attributesToRetrieve: ['id', 'title', 'author', 'category', 'price', 'rating', 'cover_url'],
    }

    if (query.category) {
      searchParams.filter = `category = "${query.category}"`
    }

    if (query.sort) {
      searchParams.sort = [query.sort]
    }

    const results = await fastify.meilisearch.index('books').search(query.q, searchParams)

    return reply.send({
      data: results.hits,
      total: results.estimatedTotalHits ?? results.hits.length,
      page: query.page,
      pageSize: query.pageSize,
    })
  })
}

export default searchRoute
