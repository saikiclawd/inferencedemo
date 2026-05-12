import { FastifyPluginAsync } from 'fastify'

const ordersRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/orders', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    const customerId = request.user.sub

    const { rows: orders } = await fastify.pg.query(
      `SELECT o.id, o.order_date, o.total, o.status,
              json_agg(json_build_object(
                'bookId', oi.book_id,
                'title', b.title,
                'author', b.author,
                'cover_url', b.cover_url,
                'quantity', oi.quantity,
                'price', oi.price
              )) AS items
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN books b ON b.id = oi.book_id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.order_date DESC`,
      [customerId],
    )

    return reply.send({ data: orders })
  })

  fastify.post('/api/orders', { preHandler: [fastify.verifyJWT] }, async (request, reply) => {
    const customerId = request.user.sub

    const { rows: cartItems } = await fastify.pg.query(
      `SELECT c.book_id, c.quantity, c.price, b.title
       FROM cart c JOIN books b ON b.id = c.book_id
       WHERE c.customer_id = $1`,
      [customerId],
    )

    if (cartItems.length === 0) {
      return reply.code(400).send({ error: 'Cart is empty', code: 'EMPTY_CART' })
    }

    const total = cartItems.reduce(
      (sum: number, item: { quantity: number; price: string }) =>
        sum + item.quantity * parseFloat(item.price),
      0,
    )

    const { rows: [order] } = await fastify.pg.query(
      `INSERT INTO orders (customer_id, total, status) VALUES ($1, $2, 'pending') RETURNING id`,
      [customerId, total.toFixed(2)],
    )

    for (const item of cartItems) {
      await fastify.pg.query(
        'INSERT INTO order_items (order_id, book_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [order.id, item.book_id, item.quantity, item.price],
      )

      await fastify.redis.zincrby('bestsellers', item.quantity, item.book_id)
    }

    await fastify.pg.query('DELETE FROM cart WHERE customer_id = $1', [customerId])

    return reply.code(201).send({ data: { orderId: order.id, total } })
  })
}

export default ordersRoute
