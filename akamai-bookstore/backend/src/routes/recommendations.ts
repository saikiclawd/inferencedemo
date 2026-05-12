import { FastifyPluginAsync } from 'fastify'

const recommendationsRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/recommendations', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    const customerId = request.user.sub

    const { rows: purchasedIds } = await fastify.pg.query(
      `SELECT DISTINCT oi.book_id
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.customer_id = $1
       LIMIT 5`,
      [customerId],
    )

    if (purchasedIds.length === 0) {
      const { rows } = await fastify.pg.query(
        'SELECT id, title, author, category, price, rating, cover_url FROM books ORDER BY rating DESC LIMIT 6',
      )
      return reply.send({ data: rows })
    }

    const seedId = purchasedIds[0].book_id
    const excludeIds = purchasedIds.map((r: { book_id: string }) => r.book_id)

    const { rows } = await fastify.pg.query(
      `SELECT id, title, author, category, price, rating, cover_url,
              1 - (embedding <=> (SELECT embedding FROM books WHERE id = $1)) AS similarity
       FROM books
       WHERE id != ALL($2::uuid[]) AND embedding IS NOT NULL
       ORDER BY embedding <=> (SELECT embedding FROM books WHERE id = $1)
       LIMIT 8`,
      [seedId, excludeIds],
    )

    return reply.send({ data: rows })
  })

  fastify.get<{ Params: { bookId: string } }>(
    '/api/recommendations/:bookId',
    async (request, reply) => {
      const { bookId } = request.params

      const { rows } = await fastify.pg.query(
        `SELECT id, title, author, category, price, rating, cover_url,
                1 - (embedding <=> (SELECT embedding FROM books WHERE id = $1)) AS similarity
         FROM books
         WHERE id != $1 AND embedding IS NOT NULL
         ORDER BY embedding <=> (SELECT embedding FROM books WHERE id = $1)
         LIMIT 6`,
        [bookId],
      )

      return reply.send({ data: rows })
    },
  )
}

export default recommendationsRoute
