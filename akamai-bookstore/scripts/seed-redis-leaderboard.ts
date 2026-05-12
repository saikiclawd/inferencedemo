import { createClient } from 'redis'
import { Client } from 'pg'

const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' })
const pg = new Client({
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
  database: process.env.POSTGRES_DB ?? 'bookstore',
  user: process.env.POSTGRES_USER ?? 'bookstore',
  password: process.env.POSTGRES_PASSWORD ?? 'changeme',
})

async function main() {
  await redis.connect()
  await pg.connect()
  console.log('Connected to Redis and PostgreSQL')

  const { rows } = await pg.query('SELECT id, rating FROM books ORDER BY rating DESC LIMIT 20')

  for (const book of rows) {
    const score = parseFloat(book.rating) * 10
    await redis.zAdd('bestsellers', { score, value: book.id })
    console.log(`  Seeded bestseller: ${book.id} (score: ${score})`)
  }

  console.log(`\nSeeded ${rows.length} books into Redis bestsellers leaderboard.`)
  await redis.disconnect()
  await pg.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
