import { FastifyPluginAsync } from 'fastify'

const bestsellersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/bestsellers', async (_request, reply) => {
    const results = await fastify.redis.zrevrange('bestsellers', 0, 19, 'WITHSCORES')

    if (results.length === 0) {
      return reply.send({ data: [] })
    }

    const bookIds: string[] = []
    const scores: Record<string, number> = {}

    for (let i = 0; i < results.length; i += 2) {
      const id = results[i]
      bookIds.push(id)
      scores[id] = parseFloat(results[i + 1])
    }

    const { rows } = await fastify.pg.query(
      'SELECT id, title, author, category, price, rating, cover_url FROM books WHERE id = ANY($1::uuid[])',
      [bookIds],
    )

    const ranked = bookIds
      .map((id) => {
        const book = rows.find((r: { id: string }) => r.id === id)
        return book ? { ...book, salesCount: scores[id] } : null
      })
      .filter(Boolean)

    return reply.send({ data: ranked })
  })
}

export default bestsellersRoute
