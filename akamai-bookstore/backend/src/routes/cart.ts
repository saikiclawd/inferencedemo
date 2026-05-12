import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const AddItemSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.number().int().min(1),
  price: z.number().positive(),
})

const UpdateItemSchema = z.object({
  bookId: z.string().uuid(),
  quantity: z.number().int().min(1),
})

const MergeSchema = z.array(
  z.object({ bookId: z.string().uuid(), quantity: z.number().int().min(1) }),
)

const cartRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/cart', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    const customerId = request.user.sub
    const { rows } = await fastify.pg.query(
      `SELECT c.id, c.book_id, c.quantity, c.price,
              b.title, b.author, b.cover_url
       FROM cart c JOIN books b ON c.book_id = b.id
       WHERE c.customer_id = $1
       ORDER BY c.updated_at DESC`,
      [customerId],
    )
    return reply.send({ data: rows })
  })

  fastify.post('/api/cart', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    const customerId = request.user.sub
    const body = AddItemSchema.parse(request.body)

    await fastify.pg.query(
      `INSERT INTO cart (customer_id, book_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (customer_id, book_id)
       DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity, updated_at = NOW()`,
      [customerId, body.bookId, body.quantity, body.price],
    )

    return reply.code(201).send({ data: { message: 'Added to cart' } })
  })

  fastify.put('/api/cart', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    const customerId = request.user.sub
    const body = UpdateItemSchema.parse(request.body)

    const { rowCount } = await fastify.pg.query(
      `UPDATE cart SET quantity = $3, updated_at = NOW()
       WHERE customer_id = $1 AND book_id = $2`,
      [customerId, body.bookId, body.quantity],
    )

    if (rowCount === 0) {
      return reply.code(404).send({ error: 'Cart item not found', code: 'NOT_FOUND' })
    }

    return reply.send({ data: { message: 'Cart updated' } })
  })

  fastify.delete<{ Params: { bookId: string } }>(
    '/api/cart/:bookId',
    { preHandler: [fastify.verifyJWT] },
    async (request, reply) => {
      const customerId = request.user.sub

      await fastify.pg.query(
        'DELETE FROM cart WHERE customer_id = $1 AND book_id = $2',
        [customerId, request.params.bookId],
      )

      return reply.code(204).send()
    },
  )

  fastify.post('/api/cart/merge', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    const customerId = request.user.sub
    const items = MergeSchema.parse(request.body)

    for (const item of items) {
      const { rows } = await fastify.pg.query('SELECT price FROM books WHERE id = $1', [item.bookId])
      if (rows.length === 0) continue

      await fastify.pg.query(
        `INSERT INTO cart (customer_id, book_id, quantity, price)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (customer_id, book_id)
         DO UPDATE SET quantity = GREATEST(cart.quantity, EXCLUDED.quantity), updated_at = NOW()`,
        [customerId, item.bookId, item.quantity, rows[0].price],
      )
    }

    return reply.send({ data: { message: 'Cart merged' } })
  })
}

export default cartRoute
