import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const BooksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
})

const booksRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/books', async (request, reply) => {
    const query = BooksQuerySchema.parse(request.query)
    const offset = (query.page - 1) * query.pageSize

    const { rows } = await fastify.pg.query(
      `SELECT id, title, author, category, price, rating, cover_url, quantity
       FROM books
       WHERE ($1::text IS NULL OR category = $1)
       ORDER BY title
       LIMIT $2 OFFSET $3`,
      [query.category ?? null, query.pageSize, offset],
    )

    const { rows: countRows } = await fastify.pg.query(
      'SELECT COUNT(*)::int AS total FROM books WHERE ($1::text IS NULL OR category = $1)',
      [query.category ?? null],
    )

    return reply.send({
      data: rows,
      total: countRows[0].total,
      page: query.page,
      pageSize: query.pageSize,
    })
  })

  fastify.get<{ Params: { id: string } }>('/api/books/:id', async (request, reply) => {
    const { rows } = await fastify.pg.query(
      'SELECT id, title, author, category, description, price, rating, cover_url, quantity FROM books WHERE id = $1',
      [request.params.id],
    )

    if (rows.length === 0) {
      return reply.code(404).send({ error: 'Book not found', code: 'NOT_FOUND' })
    }

    return reply.send({ data: rows[0] })
  })
}

export default booksRoute
